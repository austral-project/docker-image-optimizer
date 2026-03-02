/*
 * This file is part of the Austral Docker Squoosh package.
 *
 * (c) Austral <support@austral.dev>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";

const app = express();
const port = 3000;

const UPLOAD_DIR = "/home/www-data/public/uploads";
const THUMB_DIR = "/home/www-data/public/thumbnails";

app.use(express.json());

app.post("/optimize", async (req, res) => {
  try {
    const { filename, format, options = {} } = req.body;

    if (!filename || !format) {
      return res.status(400).json({ error: "filename and format required" });
    }

    const inputPath = path.join(UPLOAD_DIR, filename);

    let ext = format === "mozjpeg" ? "jpg" : format === "oxipng" ? "png" : format;
    const outputPath = path.join(THUMB_DIR, `${path.parse(filename).name}.${ext}`);

    // 🔎 cache disque simple
    try {
      await fs.access(outputPath);
      return res.json({ success: true, cached: true, output: path.basename(outputPath) });
    } catch (_) {}

    // Construire les options CLI
    let cliOptions = "{}";
    if (format === "webp" && options.webp?.quality) {
      cliOptions = `--webp '{"quality":${options.webp.quality}}'`;
    } else if (format === "mozjpeg" && options.mozjpeg?.quality) {
      cliOptions = `--mozjpeg '{"quality":${options.mozjpeg.quality}}'`;
    } else if (format === "oxipng" && options.oxipng?.level !== undefined) {
      cliOptions = `--oxipng '{"level":${options.oxipng.level}}'`;
    }

    const command = `npx --yes squoosh-cli ${cliOptions} -d ${THUMB_DIR} ${inputPath}`;

    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        return res.status(500).json({ error: "Optimization failed" });
      }

      res.json({ success: true, cached: false, output: path.basename(outputPath) });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log("Squoosh CLI service running on port 3000");
});