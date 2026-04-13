import express from "express";
import multer from "multer";
import Post from "../models/Post.js";
import { annauth as protect } from "../middleware/auth.js";
import { google } from "googleapis";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

console.log("📦 [post.routes] Module loading...");

const router = express.Router();


// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("☁️  [post.routes] Cloudinary configured. cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);

// ── Single multer using memoryStorage for ALL fields ──────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (req, file, cb) => {
    console.log("📎 [multer fileFilter] Incoming file:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });
    cb(null, true);
  },
});

const handlePostUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);
console.log("🧩 [post.routes] multer handlePostUpload middleware created");

// ── Manual Cloudinary image upload (from buffer) ──────────────────────────────
function uploadImageToCloudinary(buffer, mimetype) {
  return new Promise((resolve, reject) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("🔼 [uploadImageToCloudinary] Starting upload. bufferSize:", buffer?.length, "mimetype:", mimetype);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:          "campusly",
        resource_type:   "image",
        public_id:       `img_${uniqueSuffix}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        transformation:  [{ width: 1000, height: 1000, crop: "limit" }],
      },
      (error, result) => {
        if (error) {
          console.error("❌ [uploadImageToCloudinary] Cloudinary stream error:", error.message);
          return reject(error);
        }
        console.log("✅ [uploadImageToCloudinary] Success. secure_url:", result?.secure_url);
        resolve(result.secure_url);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

// ── YouTube OAuth2 ────────────────────────────────────────────────────────────
console.log("🎥 [post.routes] Setting up YouTube OAuth2...");
const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);
oauth2Client.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });
console.log("🎥 [post.routes] YouTube client ready. clientId:", process.env.YOUTUBE_CLIENT_ID?.slice(0, 12) + "...");

// FIX 1: Playlist — log the playlistId value so missing env is immediately
//        visible in server logs, and surface playlist errors clearly.
async function uploadToYouTube(buffer, title, playlistId) {
  console.log("▶  [uploadToYouTube] Starting. title:", title, "bufferBytes:", buffer?.length);
  console.log("▶  [uploadToYouTube] Playlist target:", playlistId || "⚠ NONE — YOUTUBE_PLAYLIST_ID env var not set");
  console.log("▶  [uploadToYouTube] ENV check:", {
    hasClientId:     !!process.env.YOUTUBE_CLIENT_ID,
    hasClientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
    hasRefreshToken: !!process.env.YOUTUBE_REFRESH_TOKEN,
    hasPlaylistId:   !!process.env.YOUTUBE_PLAYLIST_ID,
  });

  if (!buffer || buffer.length === 0) {
    console.error("❌ [uploadToYouTube] Buffer is empty — aborting");
    throw new Error("Video buffer is empty");
  }

  let res;
  try {
    console.log("📡 [uploadToYouTube] Calling youtube.videos.insert...");
    res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title:       title || "NetworkUp Post",
          description: "Shared on NetworkUp",
        },
        status: { privacyStatus: "unlisted" },
      },
      media: {
        mimeType: "video/*",
        body:     Readable.from(buffer),
      },
    });
  } catch (insertErr) {
    console.error("❌ [uploadToYouTube] youtube.videos.insert threw:", insertErr.message);
    console.error("❌ [uploadToYouTube] API response data:", JSON.stringify(insertErr?.response?.data, null, 2));
    throw insertErr;
  }

  const videoId = res.data.id;
  console.log("✅ [uploadToYouTube] Upload complete. videoId:", videoId);

  // ── FIX 1: Playlist insert ────────────────────────────────────────────────
  // Previously errors were silently swallowed. Now we log the full error so
  // you can diagnose scope / env problems. The insert itself is still
  // non-fatal (video is uploaded; playlist is a bonus).
  if (playlistId && videoId) {
    try {
      console.log("📋 [uploadToYouTube] Adding videoId", videoId, "to playlist:", playlistId);
      await youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            playlistId,
            resourceId: { kind: "youtube#video", videoId },
          },
        },
      });
      console.log("✅ [uploadToYouTube] Successfully added to playlist:", playlistId);
    } catch (playlistErr) {
      // Log the full error so you can diagnose OAuth scope or ID problems.
      console.error("❌ [uploadToYouTube] Playlist insert FAILED for playlist:", playlistId);
      console.error("❌ [uploadToYouTube] Playlist error message:", playlistErr.message);
      console.error("❌ [uploadToYouTube] Playlist API response:", JSON.stringify(playlistErr?.response?.data, null, 2));
      console.error("❌ [uploadToYouTube] Common causes:");
      console.error("   • YOUTUBE_PLAYLIST_ID env var is wrong or the playlist doesn't exist");
      console.error("   • OAuth token lacks https://www.googleapis.com/auth/youtube scope");
      console.error("   • The playlist is owned by a different YouTube account than the token");
      // Non-fatal — video was uploaded successfully; just the playlist step failed.
    }
  } else if (!playlistId) {
    console.warn("⚠  [uploadToYouTube] No playlistId provided — skipping playlist insert. Set YOUTUBE_PLAYLIST_ID in env.");
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

// ==================== PUBLIC ROUTES ====================

router.get("/posts", async (req, res) => {
  console.log("📥 [GET /posts] Fetching all posts...");
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "profileImage name")
      .lean();
    console.log(`✅ [GET /posts] Returning ${posts.length} posts`);
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.json(posts);
  } catch (err) {
    console.error("❌ [GET /posts] Error:", err.message);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
});

// ==================== PROTECTED ROUTES ====================

router.post("/post", protect, handlePostUpload, async (req, res) => {
  console.log("📥 [POST /post] Incoming create post request. userId:", req.user?._id);
  try {
    const { caption }  = req.body;
    const hasCaption   = !!(caption?.trim());
    const imageFile    = req.files?.image?.[0] ?? null;
    const videoFile    = req.files?.video?.[0] ?? null;

    console.log("📋 [POST /post] Parsed payload:", {
      hasCaption,
      userId: req.user?._id,
      imageFile: imageFile
        ? { name: imageFile.originalname, size: imageFile.size, bufferLen: imageFile.buffer?.length }
        : null,
      videoFile: videoFile
        ? { name: videoFile.originalname, size: videoFile.size, bufferLen: videoFile.buffer?.length }
        : null,
    });

    if (!imageFile && !videoFile && !hasCaption) {
      console.warn("⚠  [POST /post] Nothing to post — rejecting");
      return res.status(400).json({ message: "Please add a photo, video, or write something" });
    }

    // ── Upload image to Cloudinary ────────────────────────────────────────────
    let imageUrl = "";
    if (imageFile?.buffer) {
      console.log("🔼 [POST /post] Sending image to Cloudinary...");
      try {
        imageUrl = await uploadImageToCloudinary(imageFile.buffer, imageFile.mimetype);
        console.log("✅ [POST /post] Cloudinary done:", imageUrl);
      } catch (cdnErr) {
        console.error("❌ [POST /post] Cloudinary failed:", cdnErr.message);
        return res.status(500).json({ message: "Image upload failed. Please try again." });
      }
    }

    // ── Upload video to YouTube ───────────────────────────────────────────────
    let videoUrl = "";
    if (videoFile?.buffer) {
      console.log("🔼 [POST /post] Sending video to YouTube...");
      try {
        videoUrl = await uploadToYouTube(
          videoFile.buffer,
          caption?.trim() || req.user.name,
          process.env.YOUTUBE_PLAYLIST_ID   // pass env var directly; logged inside fn
        );
        console.log("✅ [POST /post] YouTube done:", videoUrl);
      } catch (ytErr) {
        console.error("❌ [POST /post] YouTube failed:", ytErr.message);
        console.error("❌ [POST /post] YouTube error details:", JSON.stringify(ytErr?.response?.data, null, 2));
        return res.status(500).json({ message: "Video upload to YouTube failed. Please try again." });
      }
    }

    console.log("💾 [POST /post] Saving post to DB. userId:", req.user._id, "imageUrl:", imageUrl, "videoUrl:", videoUrl);
    const newPost = new Post({
      userId:   req.user._id,
      userName: req.user.name,
      image:    imageUrl,
      videoUrl,
      caption:  hasCaption ? caption.trim() : "",
    });

    await newPost.save();
    console.log("✅ [POST /post] Post saved. _id:", newPost._id);
    await newPost.populate("userId", "profileImage name");
    res.status(201).json(newPost);
  } catch (err) {
    console.error("❌ [POST /post] Unhandled error:", err.message);
    console.error(err.stack);
    res.status(500).json({ message: "Failed to create post" });
  }
});

// DELETE a post
router.delete("/post/:id", protect, async (req, res) => {
  console.log("📥 [DELETE /post/:id] postId:", req.params.id, "requestingUser:", req.user?._id);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("⚠  [DELETE /post/:id] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }
    if (post.userId.toString() !== req.user._id.toString()) {
      console.warn("⚠  [DELETE /post/:id] Unauthorized. postOwner:", post.userId, "requester:", req.user._id);
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }
    await Post.findByIdAndDelete(req.params.id);
    console.log("✅ [DELETE /post/:id] Post deleted:", req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("❌ [DELETE /post/:id] Error:", err.message);
    res.status(500).json({ message: "Failed to delete post" });
  }
});

// LIKE / UNLIKE
router.post("/post/:id/like", protect, async (req, res) => {
  console.log("📥 [POST /post/:id/like] postId:", req.params.id, "userId:", req.user?._id);
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("⚠  [POST /post/:id/like] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }
    const userId       = req.user._id;
    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id.toString() !== userId.toString());
      console.log("💔 [POST /post/:id/like] Unliked. new count:", post.likes.length);
    } else {
      post.likes.push(userId);
      console.log("❤️  [POST /post/:id/like] Liked. new count:", post.likes.length);
    }
    await post.save();
    res.json({ likes: post.likes.length, liked: !alreadyLiked });
  } catch (err) {
    console.error("❌ [POST /post/:id/like] Error:", err.message);
    res.status(500).json({ message: "Failed to like post" });
  }
});

// ADD comment
router.post("/post/:id/comment", protect, async (req, res) => {
  console.log("📥 [POST /post/:id/comment] postId:", req.params.id, "userId:", req.user?._id);
  try {
    const { text } = req.body;
    if (!text?.trim()) {
      console.warn("⚠  [POST /post/:id/comment] Empty text — rejecting");
      return res.status(400).json({ message: "Comment text is required" });
    }
    const post = await Post.findById(req.params.id);
    if (!post) {
      console.warn("⚠  [POST /post/:id/comment] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }
    const newComment = {
      userId:    req.user._id,
      userName:  req.user.name,
      text:      text.trim(),
      createdAt: new Date(),
    };
    post.comments.push(newComment);
    await post.save();
    console.log("✅ [POST /post/:id/comment] Comment added. total comments:", post.comments.length);
    res.status(201).json(newComment);
  } catch (err) {
    console.error("❌ [POST /post/:id/comment] Error:", err.message);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

// GET user posts
router.get("/user/:userId/posts", async (req, res) => {
  const { userId } = req.params;
  console.log("📥 [GET /user/:userId/posts] Requested userId:", userId);

  if (!userId || userId === "undefined" || userId === "null") {
    console.warn("⚠  [GET /user/:userId/posts] Invalid userId received:", userId, "— returning 400");
    return res.status(400).json({ message: "Invalid userId" });
  }

  if (!/^[a-fA-F0-9]{24}$/.test(userId)) {
    console.warn("⚠  [GET /user/:userId/posts] userId is not a valid ObjectId:", userId);
    return res.status(400).json({ message: "Invalid userId format" });
  }

  try {
    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate("userId", "profileImage name")
      .lean();
    console.log(`✅ [GET /user/:userId/posts] Found ${posts.length} posts for userId:`, userId);
    res.json(posts);
  } catch (err) {
    console.error("❌ [GET /user/:userId/posts] Error:", err.message, "userId was:", userId);
    res.status(500).json({ message: "Failed to fetch user posts" });
  }
});

// DELETE comment
router.delete("/post/:postId/comment/:commentId", protect, async (req, res) => {
  console.log("📥 [DELETE /post/:postId/comment/:commentId] postId:", req.params.postId, "commentId:", req.params.commentId, "userId:", req.user?._id);
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      console.warn("⚠  [DELETE comment] Post not found");
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      console.warn("⚠  [DELETE comment] Comment not found");
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.userId.toString() !== req.user._id.toString()) {
      console.warn("⚠  [DELETE comment] Unauthorized. commentOwner:", comment.userId, "requester:", req.user._id);
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }
    post.comments.pull({ _id: req.params.commentId });
    await post.save();
    console.log("✅ [DELETE comment] Comment deleted:", req.params.commentId);
    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error("❌ [DELETE comment] Error:", err.message);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

console.log("✅ [post.routes] All routes registered");
export default router;
