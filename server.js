const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

const PORT = process.env.PORT || 3000;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "docx",
  "txt"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

app.use(express.json({ limit: "2mb" }));

app.use(express.static("."));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "GCC Tender AI System"
  });
});

app.post(
  "/api/analyze",
  upload.single("tender"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No tender file uploaded."
        });
      }

      const fileName = req.file.originalname || "tender";
      const extension = fileName
        .toLowerCase()
        .split(".")
        .pop();

      if (!ALLOWED_EXTENSIONS.has(extension)) {
        return res.status(400).json({
          success: false,
          error:
            "Unsupported file type. Supported files: PDF, DOCX and TXT."
        });
      }

      let text = "";
      let pages = 0;

      if (extension === "pdf") {
        const result = await pdfParse(req.file.buffer);

        text = result.text || "";
        pages = Number(result.numpages || 0);
      }

      if (extension === "docx") {
        const result =
          await mammoth.extractRawText({
            buffer: req.file.buffer
          });

        text = result.value || "";
        pages = 0;
      }

      if (extension === "txt") {
        text = req.file.buffer.toString("utf8");
        pages = 1;
      }

      text = text
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();

      if (!text) {
        return res.status(422).json({
          success: false,
          error:
            "No readable text was found. If this is a scanned/image-only PDF, OCR will be required."
        });
      }

      const words = text
        .split(/\s+/)
        .filter(Boolean)
        .length;

      return res.json({
        success: true,
        fileName,
        extension,
        characters: text.length,
        words,
        pages,
        text
      });
    } catch (error) {
      console.error("Tender processing error:", error);

      if (
        error &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return res.status(413).json({
          success: false,
          error:
            "File is too large. Maximum allowed size is 25 MB."
        });
      }

      return res.status(500).json({
        success: false,
        error:
          "Tender processing failed. Please try again."
      });
    }
  }
);

app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api/")
  ) {
    return res.sendFile(
      require("path").join(
        __dirname,
        "index.html"
      )
    );
  }

  next();
});

app.listen(PORT, () => {
  console.log(
    `GCC Tender AI System running on port ${PORT}`
  );
});
