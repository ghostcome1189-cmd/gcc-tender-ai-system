const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

app.use(express.json());
app.use(express.static("."));

app.post("/api/analyze", upload.single("tender"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No tender file uploaded."
      });
    }

    const fileName = req.file.originalname;
    const extension = fileName.toLowerCase().split(".").pop();

    let text = "";

    if (extension === "pdf") {
      const result = await pdfParse(req.file.buffer);
      text = result.text;
    } else if (extension === "txt") {
      text = req.file.buffer.toString("utf8");
    } else {
      return res.status(400).json({
        success: false,
        error: "Currently supported: PDF and TXT."
      });
    }

    text = text.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "No readable text was found in the document."
      });
    }

    res.json({
      success: true,
      fileName,
      characters: text.length,
      text
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Tender processing failed."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GCC Tender AI running on port ${PORT}`);
});
