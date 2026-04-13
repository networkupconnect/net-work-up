import mongoose from "mongoose";

const internshipSchema = new mongoose.Schema(
  {
    externalId:  { type: String, unique: true, required: true },
    title:       { type: String, default: "" },
    company:     { type: String, default: "" },
    location:    { type: String, default: "" },
    type:        { type: String, default: "" },
    url:         { type: String, default: "" },
    description: { type: String, default: "" },
    logo:        { type: String, default: "" },
    remote:      { type: Boolean, default: false },
    source:      { type: String, default: "" },
    tags:        { type: [String], default: [] },  // role/skill tags extracted from title+description
    postedAt:    { type: Date, default: null },
    fetchedAt:   { type: Date, default: Date.now },
  },
  { timestamps: true }
);


internshipSchema.index({ title: "text", company: "text", location: "text" });
internshipSchema.index({ fetchedAt: -1 });
internshipSchema.index({ tags: 1 });

export default mongoose.model("Internship", internshipSchema);




