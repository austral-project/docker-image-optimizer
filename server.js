import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import { EventEmitter } from "events";

EventEmitter.defaultMaxListeners = 100;
const app = express();
const port = 3000;

app.use(express.json());

app.post("/optimize", async (req, res) => {
  try {
    const { filename, formats = [], options = {}, outputDir } = req.body;

    if (!filename || !formats.length || !outputDir) {
      return res.status(400).json({ error: "filename, formats and outputDir are required" });
    }
    await fs.mkdir(outputDir, { recursive: true });

    res.json({ accepted: true });


    setImmediate(() => {
      let cliOptions = "";
      if (formats.includes("webp")) {
        const quality = options.webp?.quality ?? 75;
        cliOptions += ` --webp '{"quality":${quality}}'`;
      }

      if (formats.includes("mozjpeg")) {
        const quality = options.mozjpeg?.quality ?? 75;
        cliOptions += ` --mozjpeg '{"quality":${quality}}'`;
      }

      if (formats.includes("oxipng")) {
        const level = options.oxipng?.level ?? 1;
        cliOptions += ` --oxipng '{"level":${level}}'`;
      }

      const command = `
        node --no-experimental-fetch=false \
/home/www-data/node_modules/@squoosh/cli/src/index.js \
${cliOptions} \
-d ${outputDir} \
${filename}
      `;

      console.log("Commande Squoosh:", command);
      exec(command, (err, stdout, stderr) => {
        if (err) {
          console.error("Erreur Squoosh async:", stderr);
          return;
        }
        console.log("Compression terminée:", filename);
      });


    });
  } catch (err) {
    console.error("Erreur serveur:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(port, () => {
  console.log(`Squoosh CLI service running on port ${port}`);
});