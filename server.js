import express from "express";
import bodyParser from "body-parser";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const app = express();
app.use(bodyParser.json({ limit: "50mb" }));

app.post("/optimize", async (req, res) => {
  try {
    const { filename, formats = [], options = {}, outputDir, wait = false } = req.body;

    if (!filename || !formats.length || !outputDir) {
      return res.status(400).json({
        error: "filename, formats, and outputDir are required"
      });
    }

    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // 🔥 Shared processing logic
    const processImage = async () => {
      const inputBuffer = await fs.readFile(filename);

      const tasks = formats.map(async (format) => {
        let pipeline = sharp(inputBuffer);
        const ext = format === "mozjpeg" ? "jpg" : format;
        const outputFile = path.join(
          outputDir,
          path.basename(filename).replace(/\..+$/, `.${ext}`)
        );

        // Apply format-specific options
        if (format === "webp") {
          pipeline = pipeline.webp({ quality: options.webp?.quality ?? 75 });
        } else if (format === "mozjpeg") {
          pipeline = pipeline.jpeg({ quality: options.mozjpeg?.quality ?? 75 });
        } else if (format === "oxipng") {
          pipeline = pipeline.png({ compressionLevel: options.oxipng?.level ?? 1 });
        } else if (format === "avif") {
          pipeline = pipeline.avif({ quality: options.avif?.quality ?? 50 });
        }
        await pipeline.toFile(outputFile);
        console.log(`Image optimization completed: ${outputFile}`);
        return {
          format,
          file: outputFile
        };
      });
      return Promise.all(tasks);
    };

    if (wait) {
      const results = await processImage();
      return res.json({
        success: true,
        results
      });
    }

    // Respond immediately to avoid blocking the request
    res.json({ accepted: true });

    // Background image optimization
    setImmediate(async () => {
      try {
        await processImage();
      } catch (err) {
        console.error("Sharp async processing error:", err);
      }
    });

  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Server error" });
    }
  }
});

app.listen(3000, () => {
  console.log("Sharp image-optimizer running on port 3000");
});