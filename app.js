const App = {
  state: {
    tender: {
      fileName: "",
      extension: "",
      characters: 0,
      words: 0,
      pages: 0,
      text: ""
    },
    requirements: [],
    risks: [],
    proposal: "",
    documents: [],
    settings: {
      companyName: "",
      language: "English",
      theme: "light"
    },
    analysisStatus: "idle",
    analysisError: ""
  },

  init() {
    this.loadData();
    this.bindEvents();
    this.renderAll();
  },

  bindEvents() {
    const fileInput = document.getElementById("fileInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const resetBtn = document.getElementById("resetBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");

    if (uploadBtn && fileInput) {
      uploadBtn.addEventListener("click", () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) {
          this.useFile(file);
        }
      });
    }

    if (analyzeBtn) {
      analyzeBtn.addEventListener("click", () => this.analyzeTender());
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetTender());
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => this.saveSettings());
    }

    document.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        this.showPage(button.dataset.page);
      });
    });

    document.addEventListener("click", (event) => {
      const addRequirementButton = event.target.closest(
        "[data-action='add-requirement']"
      );

      const analyzeRisksButton = event.target.closest(
        "[data-action='analyze-risks']"
      );

      const generateProposalButton = event.target.closest(
        "[data-action='generate-proposal']"
      );

      const exportProposalButton = event.target.closest(
        "[data-action='export-proposal']"
      );

      const deleteRequirementButton = event.target.closest(
        "[data-action='delete-requirement']"
      );

      if (addRequirementButton) {
        this.addRequirement();
      }

      if (analyzeRisksButton) {
        this.analyzeRisks();
      }

      if (generateProposalButton) {
        this.generateProposal();
      }

      if (exportProposalButton) {
        this.exportProposal();
      }

      if (deleteRequirementButton) {
        const index = Number(deleteRequirementButton.dataset.index);
        this.deleteRequirement(index);
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-requirement-status]")) {
        const index = Number(event.target.dataset.index);
        this.changeRequirementStatus(index, event.target.value);
      }
    });
  },

  loadData() {
    try {
      const saved = localStorage.getItem("gccTenderAI");

      if (!saved) return;

      const data = JSON.parse(saved);

      if (data && typeof data === "object") {
        this.state = {
          ...this.state,
          ...data,
          tender: {
            ...this.state.tender,
            ...(data.tender || {})
          },
          settings: {
            ...this.state.settings,
            ...(data.settings || {})
          }
        };
      }
    } catch (error) {
      console.warn("Could not load saved data:", error);
      localStorage.removeItem("gccTenderAI");
    }
  },

  saveData() {
    try {
      localStorage.setItem(
        "gccTenderAI",
        JSON.stringify(this.state)
      );
    } catch (error) {
      console.warn("Could not save data:", error);
    }
  },

  showPage(pageName) {
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.remove("active");
    });

    const target = document.getElementById(pageName);

    if (target) {
      target.classList.add("active");
    }

    document.querySelectorAll("[data-page]").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.page === pageName
      );
    });

    this.renderAll();
  },

  validateFile(file) {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    const allowedExtensions = ["pdf", "docx", "txt"];

    if (!file) {
      return {
        valid: false,
        error: "Please select a tender file."
      };
    }

    const extension = file.name
      .toLowerCase()
      .split(".")
      .pop();

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(extension)
    ) {
      return {
        valid: false,
        error: "Only PDF, DOCX and TXT files are supported."
      };
    }

    const maxSize = 25 * 1024 * 1024;

    if (file.size > maxSize) {
      return {
        valid: false,
        error: "File size cannot exceed 25 MB."
      };
    }

    return {
      valid: true,
      extension
    };
  },

  async useFile(file) {
    const validation = this.validateFile(file);

    if (!validation.valid) {
      this.toast(validation.error, "error");
      return;
    }

    this.state.analysisStatus = "selected";
    this.state.analysisError = "";

    this.state.tender = {
      fileName: file.name,
      extension: validation.extension,
      characters: 0,
      words: 0,
      pages: 0,
      text: ""
    };

    this.saveData();
    this.renderAll();

    this.toast(
      `${file.name} selected. Click Analyze Tender to process it.`,
      "success"
    );
  },

  async createTender() {
    const fileInput = document.getElementById("fileInput");

    if (!fileInput || !fileInput.files?.[0]) {
      this.toast("Please select a tender file first.", "error");
      return;
    }

    await this.useFile(fileInput.files[0]);
  },

  resetTender() {
    this.state.tender = {
      fileName: "",
      extension: "",
      characters: 0,
      words: 0,
      pages: 0,
      text: ""
    };

    this.state.requirements = [];
    this.state.risks = [];
    this.state.proposal = "";
    this.state.analysisStatus = "idle";
    this.state.analysisError = "";

    const fileInput = document.getElementById("fileInput");

    if (fileInput) {
      fileInput.value = "";
    }

    this.saveData();
    this.renderAll();

    this.toast("Tender workspace has been reset.", "success");
  },

  async analyzeTender() {
    const fileInput = document.getElementById("fileInput");

    if (!fileInput || !fileInput.files?.[0]) {
      this.toast("Please select a PDF, DOCX or TXT file first.", "error");
      return;
    }

    const file = fileInput.files[0];

    const validation = this.validateFile(file);

    if (!validation.valid) {
      this.toast(validation.error, "error");
      return;
    }

    this.state.analysisStatus = "extracting";
    this.state.analysisError = "";

    this.setWorkflowStep(2);
    this.setProgress(20);
    this.setStatus("Uploading tender document...");

    this.renderAll();

    try {
      const formData = new FormData();
      formData.append("tender", file);

      this.setProgress(40);
      this.setStatus("Extracting document text...");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error || "Tender processing failed."
        );
      }

      this.state.tender = {
        fileName: data.fileName || file.name,
        extension:
          data.extension || validation.extension,
        characters: Number(data.characters || 0),
        words: Number(data.words || 0),
        pages: Number(data.pages || 0),
        text: data.text || ""
      };

      this.state.analysisStatus = "extracted";

      this.setWorkflowStep(3);
      this.setProgress(70);
      this.setStatus("Document extraction completed.");

      this.saveData();
      this.renderAll();

      this.generateInitialRequirements();

      setTimeout(() => {
        this.setWorkflowStep(4);
        this.setProgress(100);
        this.setStatus(
          "Extraction completed. Document is ready for verification."
        );

        this.state.analysisStatus = "ready";
        this.saveData();
        this.renderAll();
      }, 500);

      this.toast(
        "Tender document extracted successfully.",
        "success"
      );
    } catch (error) {
      console.error(error);

      this.state.analysisStatus = "error";
      this.state.analysisError =
        error.message || "Tender processing failed.";

      this.setProgress(0);
      this.setStatus(this.state.analysisError);

      this.saveData();
      this.renderAll();

      this.toast(
        this.state.analysisError,
        "error"
      );
    }
  },

  setProgress(value) {
    const progressBars = document.querySelectorAll(
      "[data-progress]"
    );

    progressBars.forEach((bar) => {
      bar.style.width = `${Math.max(
        0,
        Math.min(100, value)
      )}%`;
    });

    const progressText = document.querySelectorAll(
      "[data-progress-text]"
    );

    progressText.forEach((element) => {
      element.textContent = `${Math.round(value)}%`;
    });
  },

  setStatus(message) {
    document.querySelectorAll("[data-analysis-status]").forEach(
      (element) => {
        element.textContent = message;
      }
    );
  },

  setWorkflowStep(step) {
    document.querySelectorAll(
      "#analysisWorkflow [data-step]"
    ).forEach((element) => {
      const currentStep = Number(element.dataset.step);

      element.classList.toggle(
        "active",
        currentStep === step
      );

      element.classList.toggle(
        "completed",
        currentStep < step
      );
    });
  },

  generateInitialRequirements() {
    const text = this.state.tender.text || "";

    if (!text.trim()) {
      this.state.requirements = [];
      this.saveData();
      this.renderRequirements();
      return;
    }

    const requirements = [];

    const patterns = [
      {
        regex: /deadline|submission date|closing date|bid closing/i,
        title: "Tender submission deadline",
        category: "Administrative"
      },
      {
        regex: /technical proposal|technical offer/i,
        title: "Technical proposal requirement",
        category: "Technical"
      },
      {
        regex: /financial proposal|commercial proposal|price schedule/i,
        title: "Financial/commercial submission",
        category: "Commercial"
      },
      {
        regex: /performance bond|performance guarantee/i,
        title: "Performance guarantee requirement",
        category: "Financial"
      },
      {
        regex: /insurance/i,
        title: "Insurance requirement",
        category: "Compliance"
      },
      {
        regex: /experience|similar projects|similar experience/i,
        title: "Relevant project experience",
        category: "Qualification"
      }
    ];

    patterns.forEach((item) => {
      if (item.regex.test(text)) {
        requirements.push({
          title: item.title,
          category: item.category,
          status: "Pending",
          source: "Tender document"
        });
      }
    });

    this.state.requirements = requirements;
    this.saveData();
    this.renderRequirements();
    this.updateDashboard();
  },

  addRequirement() {
    this.state.requirements.push({
      title: "New tender requirement",
      category: "General",
      status: "Pending",
      source: "Manual entry"
    });

    this.saveData();
    this.renderRequirements();
    this.updateDashboard();
  },

  changeRequirementStatus(index, status) {
    if (!this.state.requirements[index]) return;

    this.state.requirements[index].status = status;

    this.saveData();
    this.renderRequirements();
    this.updateDashboard();
  },

  deleteRequirement(index) {
    if (!this.state.requirements[index]) return;

    this.state.requirements.splice(index, 1);

    this.saveData();
    this.renderRequirements();
    this.updateDashboard();
  },

  analyzeRisks() {
    if (!this.state.tender.text) {
      this.toast(
        "Analyze a tender document before reviewing risks.",
        "error"
      );
      return;
    }

    /*
      Phase 1 intentionally does not invent AI-generated risks.
      Real AI risk intelligence will be connected in Phase 2.
    */

    this.state.risks = [
      {
        title: "AI risk analysis pending",
        severity: "Pending",
        description:
          "The tender has been extracted successfully. Real risk scoring and clause-level analysis will be added when the AI analysis engine is connected.",
        source: "System"
      }
    ];

    this.saveData();
    this.renderRisks();

    this.toast(
      "Tender extracted. AI risk analysis is not connected yet.",
      "success"
    );
  },

  generateProposal() {
    if (!this.state.tender.text) {
      this.toast(
        "Analyze a tender document before generating a proposal.",
        "error"
      );
      return;
    }

    const tenderName =
      this.state.tender.fileName || "Tender Document";

    const requirements = this.state.requirements;

    const requirementSection =
      requirements.length > 0
        ? requirements
            .map(
              (item, index) =>
                `${index + 1}. ${item.title} — ${item.status}`
            )
            .join("\n")
        : "No structured requirements have been added yet.";

    this.state.proposal = `TECHNICAL PROPOSAL DRAFT

Tender:
${tenderName}

1. EXECUTIVE SUMMARY

This document is a structured proposal draft generated from the uploaded tender document. It is intended as a working framework and must be reviewed against the complete tender requirements before submission.

2. UNDERSTANDING OF REQUIREMENTS

The uploaded tender document has been successfully extracted and is available for detailed review.

3. REQUIREMENT CHECKLIST

${requirementSection}

4. TECHNICAL APPROACH

A detailed technical methodology should be prepared after reviewing the scope of work, specifications, drawings, standards, deliverables, schedule and contractual requirements.

5. PROJECT EXECUTION

The final execution plan should define:
- Mobilization
- Resources
- Personnel
- Equipment
- Procurement
- Quality control
- Health and safety
- Environmental controls
- Schedule
- Reporting

6. QUALITY MANAGEMENT

The final proposal should include the applicable quality assurance and quality control procedures required by the tender.

7. HEALTH, SAFETY AND ENVIRONMENT

The final submission should address all HSE obligations specified in the tender documents.

8. COMMERCIAL AND CONTRACTUAL COMPLIANCE

Commercial schedules, guarantees, insurance requirements, contractual obligations and submission forms must be checked against the official tender documents.

9. FINAL REVIEW

This is a proposal framework, not a final AI-generated tender response. Every statement must be verified against the source tender before submission.
`;

    this.saveData();
    this.renderProposal();

    this.showPage("proposal");

    this.toast(
      "Proposal framework created.",
      "success"
    );
  },

  exportProposal() {
    if (!this.state.proposal) {
      this.toast(
        "Generate the proposal first.",
        "error"
      );
      return;
    }

    const fileName =
      (this.state.tender.fileName || "tender")
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9-_]+/gi, "_");

    const blob = new Blob(
      [this.state.proposal],
      {
        type: "text/plain;charset=utf-8"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}_proposal_draft.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    this.toast(
      "Proposal draft exported.",
      "success"
    );
  },

  addDocument() {
    const name = prompt("Document name:");

    if (!name || !name.trim()) {
      return;
    }

    this.state.documents.push({
      name: name.trim(),
      addedAt: new Date().toISOString()
    });

    this.saveData();
    this.renderDocuments();

    this.toast(
      "Document added.",
      "success"
    );
  },

  saveSettings() {
    const companyName =
      document.getElementById("companyName")?.value || "";

    const language =
      document.getElementById("language")?.value || "English";

    const theme =
      document.getElementById("theme")?.value || "light";

    this.state.settings = {
      companyName: companyName.trim(),
      language,
      theme
    };

    this.saveData();

    document.documentElement.dataset.theme = theme;

    this.toast(
      "Settings saved.",
      "success"
    );
  },

  renderAll() {
    this.renderTender();
    this.renderWorkflow();
    this.renderAnalysis();
    this.renderRequirements();
    this.renderRisks();
    this.renderProposal();
    this.renderDocuments();
    this.renderSettings();
    this.updateDashboard();
  },

  renderTender() {
    const fileNameElements =
      document.querySelectorAll("[data-tender-file]");

    fileNameElements.forEach((element) => {
      element.textContent =
        this.state.tender.fileName || "No tender selected";
    });

    const extensionElements =
      document.querySelectorAll("[data-tender-extension]");

    extensionElements.forEach((element) => {
      element.textContent =
        this.state.tender.extension
          ? this.state.tender.extension.toUpperCase()
          : "—";
    });

    const characterElements =
      document.querySelectorAll("[data-tender-characters]");

    characterElements.forEach((element) => {
      element.textContent =
        this.state.tender.characters.toLocaleString();
    });

    const wordElements =
      document.querySelectorAll("[data-tender-words]");

    wordElements.forEach((element) => {
      element.textContent =
        this.state.tender.words.toLocaleString();
    });

    const pageElements =
      document.querySelectorAll("[data-tender-pages]");

    pageElements.forEach((element) => {
      element.textContent =
        this.state.tender.pages || "—";
    });
  },

  renderWorkflow() {
    const containers = [
      document.getElementById("analysisWorkflow"),
      document.getElementById("dashboardWorkflow")
    ].filter(Boolean);

    const status = this.state.analysisStatus;

    let currentStep = 1;

    if (
      status === "extracting" ||
      status === "selected"
    ) {
      currentStep = 2;
    }

    if (
      status === "extracted" ||
      status === "ready"
    ) {
      currentStep = 4;
    }

    if (status === "error") {
      currentStep = 2;
    }

    containers.forEach((container) => {
      container.innerHTML = `
        <div class="workflow-step ${currentStep >= 1 ? "active" : ""}">
          <span>1</span>
          <div>Upload</div>
        </div>

        <div class="workflow-line"></div>

        <div class="workflow-step ${
          currentStep >= 2 ? "active" : ""
        }">
          <span>2</span>
          <div>Extract</div>
        </div>

        <div class="workflow-line"></div>

        <div class="workflow-step ${
          currentStep >= 3 ? "active" : ""
        }">
          <span>3</span>
          <div>Analyze</div>
        </div>

        <div class="workflow-line"></div>

        <div class="workflow-step ${
          currentStep >= 4 ? "active" : ""
        }">
          <span>4</span>
          <div>Verify</div>
        </div>

        <div class="workflow-line"></div>

        <div class="workflow-step ${
          currentStep >= 5 ? "active" : ""
        }">
          <span>5</span>
          <div>Build</div>
        </div>
      `;
    });
  },

  renderAnalysis() {
    const textElement =
      document.getElementById("extractedText");

    if (textElement) {
      textElement.textContent =
        this.state.tender.text ||
        "No extracted text available.";
    }

    const errorElement =
      document.querySelector("[data-analysis-error]");

    if (errorElement) {
      errorElement.textContent =
        this.state.analysisError || "";
    }

    this.setProgress(
      this.state.analysisStatus === "ready" ||
      this.state.analysisStatus === "extracted"
        ? 100
        : this.state.analysisStatus === "extracting"
        ? 40
        : 0
    );

    if (this.state.analysisStatus === "error") {
      this.setStatus(this.state.analysisError);
    } else if (this.state.analysisStatus === "ready") {
      this.setStatus(
        "Extraction completed. Document is ready for verification."
      );
    } else if (this.state.analysisStatus === "selected") {
      this.setStatus(
        "File selected. Ready to analyze."
      );
    } else {
      this.setStatus(
        "Upload a tender document to begin."
      );
    }
  },

  renderRequirements() {
    const containers =
      document.querySelectorAll("[data-requirements-list]");

    containers.forEach((container) => {
      if (!this.state.requirements.length) {
        container.innerHTML = `
          <div class="empty-state">
            No requirements identified yet.
          </div>
        `;
        return;
      }

      container.innerHTML =
        this.state.requirements
          .map(
            (item, index) => `
              <div class="requirement-row">
                <div>
                  <strong>${this.escape(item.title)}</strong>
                  <small>
                    ${this.escape(item.category)}
                    ·
                    ${this.escape(item.source)}
                  </small>
                </div>

                <select
                  data-requirement-status
                  data-index="${index}"
                >
                  <option ${
                    item.status === "Pending"
                      ? "selected"
                      : ""
                  }>Pending</option>

                  <option ${
                    item.status === "Compliant"
                      ? "selected"
                      : ""
                  }>Compliant</option>

                  <option ${
                    item.status === "Partial"
                      ? "selected"
                      : ""
                  }>Partial</option>

                  <option ${
                    item.status === "Non-Compliant"
                      ? "selected"
                      : ""
                  }>Non-Compliant</option>
                </select>

                <button
                  type="button"
                  data-action="delete-requirement"
                  data-index="${index}"
                >
                  Delete
                </button>
              </div>
            `
          )
          .join("");
    });
  },

  renderRisks() {
    const containers =
      document.querySelectorAll("[data-risks-list]");

    containers.forEach((container) => {
      if (!this.state.risks.length) {
        container.innerHTML = `
          <div class="empty-state">
            No risk analysis available yet.
          </div>
        `;
        return;
      }

      container.innerHTML =
        this.state.risks
          .map(
            (risk) => `
              <div class="risk-card">
                <div>
                  <strong>${this.escape(
                    risk.title
                  )}</strong>

                  <span>
                    ${this.escape(
                      risk.severity
                    )}
                  </span>
                </div>

                <p>
                  ${this.escape(
                    risk.description
                  )}
                </p>

                <small>
                  ${this.escape(
                    risk.source
                  )}
                </small>
              </div>
            `
          )
          .join("");
    });
  },

  renderProposal() {
    const elements =
      document.querySelectorAll("[data-proposal]");

    elements.forEach((element) => {
      element.value =
        this.state.proposal || "";
    });
  },

  renderDocuments() {
    const containers =
      document.querySelectorAll("[data-documents-list]");

    containers.forEach((container) => {
      if (!this.state.documents.length) {
        container.innerHTML = `
          <div class="empty-state">
            No documents added.
          </div>
        `;
        return;
      }

      container.innerHTML =
        this.state.documents
          .map(
            (documentItem) => `
              <div class="document-row">
                <strong>
                  ${this.escape(
                    documentItem.name
                  )}
                </strong>

                <small>
                  ${new Date(
                    documentItem.addedAt
                  ).toLocaleString()}
                </small>
              </div>
            `
          )
          .join("");
    });
  },

  renderSettings() {
    const companyInput =
      document.getElementById("companyName");

    const languageInput =
      document.getElementById("language");

    const themeInput =
      document.getElementById("theme");

    if (companyInput) {
      companyInput.value =
        this.state.settings.companyName || "";
    }

    if (languageInput) {
      languageInput.value =
        this.state.settings.language || "English";
    }

    if (themeInput) {
      themeInput.value =
        this.state.settings.theme || "light";
    }

    document.documentElement.dataset.theme =
      this.state.settings.theme || "light";
  },

  updateDashboard() {
    const tenderCount =
      document.querySelectorAll(
        "[data-stat='tenders']"
      );

    tenderCount.forEach((element) => {
      element.textContent =
        this.state.tender.fileName ? "1" : "0";
    });

    const requirementCount =
      document.querySelectorAll(
        "[data-stat='requirements']"
      );

    requirementCount.forEach((element) => {
      element.textContent =
        this.state.requirements.length;
    });

    const riskCount =
      document.querySelectorAll(
        "[data-stat='risks']"
      );

    riskCount.forEach((element) => {
      element.textContent =
        this.state.risks.length;
    });

    const documentCount =
      document.querySelectorAll(
        "[data-stat='documents']"
      );

    documentCount.forEach((element) => {
      element.textContent =
        this.state.documents.length;
    });
  },

  escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  toast(message, type = "info") {
    let container =
      document.getElementById("toastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";

      container.style.position = "fixed";
      container.style.right = "20px";
      container.style.bottom = "20px";
      container.style.zIndex = "9999";
      container.style.display = "flex";
      container.style.flexDirection = "column";
      container.style.gap = "10px";

      document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.textContent = message;

    toast.style.padding = "12px 16px";
    toast.style.borderRadius = "8px";
    toast.style.background =
      type === "error" ? "#b42318" : "#1f2937";
    toast.style.color = "#ffffff";
    toast.style.fontSize = "14px";
    toast.style.maxWidth = "360px";
    toast.style.boxShadow =
      "0 8px 24px rgba(0,0,0,.18)";

    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4000);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
