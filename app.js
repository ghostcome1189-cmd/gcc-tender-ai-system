const App = {
  state: {
    tender: {
      name: "",
      country: "",
      number: "",
      client: "",
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
      country: "",
      language: "English"
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
    const tenderFile = document.getElementById("tenderFile");
    const createTenderBtn = document.getElementById("createTenderBtn");
    const runAnalysisBtn = document.getElementById("runAnalysisBtn");
    const resetTenderBtn = document.getElementById("resetTenderBtn");

    const addRequirementBtn =
      document.getElementById("addRequirementBtn");

    const runRiskBtn =
      document.getElementById("runRiskBtn");

    const generateProposalBtn =
      document.getElementById("generateProposalBtn");

    const exportProposalBtn =
      document.getElementById("exportProposalBtn");

    const documentFile =
      document.getElementById("documentFile");

    const quickFile =
      document.getElementById("quickFile");

    const saveSettingsBtn =
      document.getElementById("saveSettingsBtn");

    if (tenderFile) {
      tenderFile.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) this.useFile(file);
      });
    }

    if (createTenderBtn) {
      createTenderBtn.addEventListener("click", () => {
        this.createTender();
      });
    }

    if (runAnalysisBtn) {
      runAnalysisBtn.addEventListener("click", () => {
        this.analyzeTender();
      });
    }

    if (resetTenderBtn) {
      resetTenderBtn.addEventListener("click", () => {
        this.resetTender();
      });
    }

    if (addRequirementBtn) {
      addRequirementBtn.addEventListener("click", () => {
        this.addRequirement();
      });
    }

    if (runRiskBtn) {
      runRiskBtn.addEventListener("click", () => {
        this.analyzeRisks();
      });
    }

    if (generateProposalBtn) {
      generateProposalBtn.addEventListener("click", () => {
        this.generateProposal();
      });
    }

    if (exportProposalBtn) {
      exportProposalBtn.addEventListener("click", () => {
        this.exportProposal();
      });
    }

    if (documentFile) {
      documentFile.addEventListener("change", (event) => {
        const file = event.target.files?.[0];
        if (file) {
          this.documents.push({
            name: file.name,
            size: file.size,
            type: file.type
          });

          this.saveData();
          this.renderDocuments();
        }
      });
    }

    if (quickFile) {
      quickFile.addEventListener("change", (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        this.useFile(file);

        const tenderFileInput =
          document.getElementById("tenderFile");

        if (tenderFileInput) {
          try {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            tenderFileInput.files = dataTransfer.files;
          } catch (error) {}
        }

        this.showPage("analysis");
      });
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => {
        this.saveSettings();
      });
    }

    document.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        this.showPage(button.dataset.page);
      });
    });

    document.addEventListener("click", (event) => {
      const deleteButton =
        event.target.closest("[data-delete-requirement]");

      if (deleteButton) {
        const index = Number(
          deleteButton.dataset.deleteRequirement
        );

        this.deleteRequirement(index);
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-requirement-status]")) {
        const index = Number(
          event.target.dataset.index
        );

        this.changeRequirementStatus(
          index,
          event.target.value
        );
      }
    });
  },

  useFile(file) {
    const extension =
      file.name.split(".").pop().toLowerCase();

    this.state.tender.fileName = file.name;
    this.state.tender.extension = extension;

    const fileNameElement =
      document.getElementById("tenderFileName");

    if (fileNameElement) {
      fileNameElement.textContent = file.name;
    }

    this.saveData();
    this.renderTender();
  },

  createTender() {
    const name =
      document.getElementById("tenderName")?.value.trim() || "";

    const country =
      document.getElementById("tenderCountry")?.value.trim() || "";

    const number =
      document.getElementById("tenderNumber")?.value.trim() || "";

    const client =
      document.getElementById("tenderClient")?.value.trim() || "";

    const file =
      document.getElementById("tenderFile")?.files?.[0];

    this.state.tender.name = name;
    this.state.tender.country = country;
    this.state.tender.number = number;
    this.state.tender.client = client;

    if (file) {
      this.useFile(file);
    }

    this.saveData();
    this.renderAll();

    this.showPage("analysis");
  },

  async analyzeTender() {
    const fileInput =
      document.getElementById("tenderFile");

    const file = fileInput?.files?.[0];

    if (!file) {
      this.state.analysisError =
        "Please select a PDF, DOCX, or TXT file.";

      this.state.analysisStatus = "error";

      this.renderAnalysis();
      return;
    }

    const allowed =
      ["pdf", "docx", "txt"];

    const extension =
      file.name.split(".").pop().toLowerCase();

    if (!allowed.includes(extension)) {
      this.state.analysisError =
        "Supported files: PDF, DOCX, TXT.";

      this.state.analysisStatus = "error";

      this.renderAnalysis();
      return;
    }

    this.state.analysisStatus = "uploading";
    this.state.analysisError = "";

    this.renderAnalysis();

    const progress =
      document.getElementById("analysisProgress");

    try {
      if (progress) progress.value = 20;

      const formData = new FormData();

      formData.append("tender", file);

      if (progress) progress.value = 45;

      const response = await fetch(
        "/api/analyze",
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}`
        );
      }

      if (progress) progress.value = 75;

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Document analysis failed."
        );
      }

      this.state.tender.fileName =
        result.fileName || file.name;

      this.state.tender.extension =
        result.extension || extension;

      this.state.tender.characters =
        Number(result.characters || 0);

      this.state.tender.words =
        Number(result.words || 0);

      this.state.tender.pages =
        Number(result.pages || 0);

      this.state.tender.text =
        result.text || "";

      this.state.requirements =
        this.generateInitialRequirements(
          this.state.tender.text
        );

      this.state.analysisStatus = "completed";
      this.state.analysisError = "";

      if (progress) progress.value = 100;

      this.saveData();
      this.renderAll();

    } catch (error) {
      console.error(error);

      this.state.analysisStatus = "error";

      this.state.analysisError =
        error.message ||
        "Unable to analyze the document.";

      this.renderAnalysis();
    }
  },

  generateInitialRequirements(text) {
    const requirements = [];

    if (!text) return requirements;

    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const keywords = [
      "shall",
      "must",
      "required",
      "requirement",
      "mandatory",
      "submit",
      "provide",
      "minimum",
      "valid"
    ];

    lines.forEach((line) => {
      const lower = line.toLowerCase();

      if (
        keywords.some((keyword) =>
          lower.includes(keyword)
        )
      ) {
        requirements.push({
          requirement: line.slice(0, 500),
          source: "Tender document",
          status: "Pending"
        });
      }
    });

    return requirements.slice(0, 100);
  },

  addRequirement() {
    this.state.requirements.push({
      requirement: "New requirement",
      source: "Manual",
      status: "Pending"
    });

    this.saveData();
    this.renderRequirements();
    this.updateDashboard();
  },

  deleteRequirement(index) {
    if (
      index < 0 ||
      index >= this.state.requirements.length
    ) {
      return;
    }

    this.state.requirements.splice(index, 1);

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

  analyzeRisks() {
    const text =
      this.state.tender.text.toLowerCase();

    const risks = [];

    if (!text) {
      risks.push({
        level: "High",
        title: "Tender document not analyzed",
        description:
          "Analyze the tender document before performing risk analysis."
      });
    } else {
      const checks = [
        {
          words: [
            "liquidated damages",
            "liquidated damage",
            "penalty"
          ],
          title: "Potential penalties",
          description:
            "Tender text contains penalty or liquidated-damages provisions."
        },
        {
          words: [
            "performance bond",
            "performance guarantee"
          ],
          title: "Performance security",
          description:
            "Tender text contains performance-security requirements."
        },
        {
          words: [
            "delay",
            "completion date",
            "completion period"
          ],
          title: "Schedule risk",
          description:
            "Tender text contains schedule or delay-related requirements."
        },
        {
          words: [
            "warranty",
            "defects liability"
          ],
          title: "Warranty obligation",
          description:
            "Tender text contains warranty or defects-liability provisions."
        },
        {
          words: [
            "insurance",
            "indemnity"
          ],
          title: "Insurance / indemnity",
          description:
            "Tender text contains insurance or indemnity obligations."
        }
      ];

      checks.forEach((check) => {
        if (
          check.words.some((word) =>
            text.includes(word)
          )
        ) {
          risks.push({
            level: "Medium",
            title: check.title,
            description: check.description
          });
        }
      });

      if (risks.length === 0) {
        risks.push({
          level: "Low",
          title: "No obvious keyword-based risks found",
          description:
            "The current rule-based scan did not identify common risk keywords."
        });
      }
    }

    this.state.risks = risks;

    this.saveData();
    this.renderRisks();
  },

  generateProposal() {
    const language =
      document.getElementById("proposalLanguage")?.value ||
      this.state.settings.language ||
      "English";

    const type =
      document.getElementById("proposalType")?.value ||
      "Technical Proposal";

    const tender =
      this.state.tender;

    const company =
      this.state.settings.companyName ||
      "Your Company";

    const proposal = [
      `${type}`,
      "",
      `Tender: ${tender.name || "N/A"}`,
      `Tender Number: ${tender.number || "N/A"}`,
      `Client: ${tender.client || "N/A"}`,
      `Country: ${tender.country || "N/A"}`,
      "",
      "1. Introduction",
      `This proposal is submitted by ${company} in response to the tender requirements.`,
      "",
      "2. Understanding of Requirements",
      "The tender document has been reviewed and the identified requirements have been considered in preparing this proposal.",
      "",
      "3. Methodology",
      "Our proposed methodology will follow the technical specifications, contractual requirements, applicable standards, quality requirements, and project schedule stated in the tender documents.",
      "",
      "4. Quality Management",
      "Quality control and quality assurance procedures will be implemented throughout project execution.",
      "",
      "5. Health, Safety and Environment",
      "Applicable health, safety and environmental requirements will be incorporated into project execution.",
      "",
      "6. Project Management",
      "The project will be managed using defined responsibilities, reporting procedures, document control, progress monitoring and risk management.",
      "",
      "7. Compliance",
      "The final submission should be checked against every mandatory requirement before submission.",
      "",
      `Language: ${language}`
    ].join("\n");

    this.state.proposal = proposal;

    this.saveData();
    this.renderProposal();

    this.showPage("proposal");
  },

  exportProposal() {
    const content =
      this.state.proposal ||
      document.getElementById("proposalContent")?.value ||
      "";

    if (!content.trim()) {
      return;
    }

    const blob =
      new Blob([content], {
        type: "text/plain;charset=utf-8"
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "GCC-Tender-Proposal.txt";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  },

  resetTender() {
    this.state.tender = {
      name: "",
      country: "",
      number: "",
      client: "",
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

    const fileInput =
      document.getElementById("tenderFile");

    if (fileInput) {
      fileInput.value = "";
    }

    this.saveData();
    this.renderAll();
  },

  saveSettings() {
    this.state.settings.companyName =
      document.getElementById("companyName")?.value || "";

    this.state.settings.country =
      document.getElementById("defaultCountry")?.value || "";

    this.state.settings.language =
      document.getElementById("defaultLanguage")?.value ||
      "English";

    this.saveData();
    this.renderSettings();
  },

  showPage(page) {
    document.querySelectorAll("[data-page-content]").forEach(
      (section) => {
        section.style.display =
          section.dataset.pageContent === page
            ? ""
            : "none";
      }
    );

    document.querySelectorAll("[data-page]").forEach(
      (button) => {
        button.classList.toggle(
          "active",
          button.dataset.page === page
        );
      }
    );
  },

  renderAll() {
    this.renderTender();
    this.renderAnalysis();
    this.renderRequirements();
    this.renderRisks();
    this.renderProposal();
    this.renderDocuments();
    this.renderSettings();
    this.updateDashboard();
  },

  renderTender() {
    const fileName =
      document.getElementById("tenderFileName");

    if (fileName) {
      fileName.textContent =
        this.state.tender.fileName ||
        "No file selected";
    }

    const fields = {
      tenderName: this.state.tender.name,
      tenderCountry: this.state.tender.country,
      tenderNumber: this.state.tender.number,
      tenderClient: this.state.tender.client
    };

    Object.entries(fields).forEach(
      ([id, value]) => {
        const element =
          document.getElementById(id);

        if (
          element &&
          document.activeElement !== element
        ) {
          element.value = value || "";
        }
      }
    );
  },

  renderAnalysis() {
    const status =
      document.getElementById("analysisStatus");

    const progress =
      document.getElementById("analysisProgress");

    const summary =
      document.getElementById("analysisSummary");

    const extracted =
      document.getElementById("extractedText");

    if (progress) {
      const values = {
        idle: 0,
        uploading: 30,
        completed: 100,
        error: 0
      };

      progress.value =
        values[this.state.analysisStatus] ?? 0;
    }

    if (status) {
      const messages = {
        idle: "Ready",
        uploading: "Extracting and analyzing document...",
        completed: "Analysis completed",
        error: this.state.analysisError || "Analysis failed"
      };

      status.textContent =
        messages[this.state.analysisStatus] ||
        "Ready";
    }

    if (summary) {
      if (this.state.analysisStatus === "completed") {
        summary.textContent =
          `${this.state.tender.fileName} — ` +
          `${this.state.tender.words.toLocaleString()} words, ` +
          `${this.state.tender.characters.toLocaleString()} characters, ` +
          `${this.state.tender.pages} pages.`;
      } else if (this.state.analysisError) {
        summary.textContent =
          this.state.analysisError;
      } else {
        summary.textContent =
          "No analysis completed yet.";
      }
    }

    if (extracted) {
      extracted.value =
        this.state.tender.text || "";
    }
  },

  renderRequirements() {
    const body =
      document.getElementById("requirementsBody");

    if (!body) return;

    body.innerHTML = "";

    if (!this.state.requirements.length) {
      const row =
        document.createElement("tr");

      row.innerHTML =
        `<td colspan="5">No requirements identified yet.</td>`;

      body.appendChild(row);

      return;
    }

    this.state.requirements.forEach(
      (item, index) => {
        const row =
          document.createElement("tr");

        row.innerHTML = `
          <td>${this.escape(item.requirement)}</td>
          <td>${this.escape(item.source)}</td>
          <td>—</td>
          <td>
            <select
              data-requirement-status
              data-index="${index}"
            >
              <option value="Pending" ${
                item.status === "Pending"
                  ? "selected"
                  : ""
              }>Pending</option>

              <option value="In Progress" ${
                item.status === "In Progress"
                  ? "selected"
                  : ""
              }>In Progress</option>

              <option value="Complete" ${
                item.status === "Complete"
                  ? "selected"
                  : ""
              }>Complete</option>
            </select>
          </td>

          <td>
            <button
              type="button"
              data-delete-requirement="${index}"
            >
              Delete
            </button>
          </td>
        `;

        body.appendChild(row);
      }
    );
  },

  renderRisks() {
    const list =
      document.getElementById("riskList");

    if (!list) return;

    list.innerHTML = "";

    if (!this.state.risks.length) {
      list.innerHTML =
        "<li>No risks analyzed yet.</li>";

      return;
    }

    this.state.risks.forEach((risk) => {
      const item =
        document.createElement("li");

      item.innerHTML = `
        <strong>${this.escape(risk.level)}</strong>
        — ${this.escape(risk.title)}
        <br>
        <span>${this.escape(risk.description)}</span>
      `;

      list.appendChild(item);
    });
  },

  renderProposal() {
    const content =
      document.getElementById("proposalContent");

    if (!content) return;

    content.value =
      this.state.proposal || "";
  },

  renderDocuments() {
    const container =
      document.querySelector("[data-documents-list]");

    if (!container) return;

    container.innerHTML =
      this.state.documents.length
        ? this.state.documents
            .map(
              (doc) =>
                `<div>${this.escape(doc.name)}</div>`
            )
            .join("")
        : "";
  },

  renderSettings() {
    const company =
      document.getElementById("companyName");

    const country =
      document.getElementById("defaultCountry");

    const language =
      document.getElementById("defaultLanguage");

    if (
      company &&
      document.activeElement !== company
    ) {
      company.value =
        this.state.settings.companyName || "";
    }

    if (
      country &&
      document.activeElement !== country
    ) {
      country.value =
        this.state.settings.country || "";
    }

    if (
      language &&
      document.activeElement !== language
    ) {
      language.value =
        this.state.settings.language ||
        "English";
    }
  },

  updateDashboard() {
    const tenderCount =
      document.getElementById("statTenders");

    const requirementCount =
      document.getElementById("statRequirements");

    const compliance =
      document.getElementById("statCompliance");

    const highRisks =
      document.getElementById("statHighRisks");

    if (tenderCount) {
      tenderCount.textContent =
        this.state.tender.fileName ? "1" : "0";
    }

    if (requirementCount) {
      requirementCount.textContent =
        this.state.requirements.length;
    }

    if (compliance) {
      const total =
        this.state.requirements.length;

      const complete =
        this.state.requirements.filter(
          (item) => item.status === "Complete"
        ).length;

      compliance.textContent =
        total
          ? `${Math.round(
              (complete / total) * 100
            )}%`
          : "0%";
    }

    if (highRisks) {
      highRisks.textContent =
        this.state.risks.filter(
          (risk) => risk.level === "High"
        ).length;
    }
  },

  saveData() {
    try {
      localStorage.setItem(
        "gccTenderAI",
        JSON.stringify(this.state)
      );
    } catch (error) {
      console.warn(
        "Unable to save local data.",
        error
      );
    }
  },

  loadData() {
    try {
      const saved =
        localStorage.getItem("gccTenderAI");

      if (!saved) return;

      const data =
        JSON.parse(saved);

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
    } catch (error) {
      console.warn(
        "Unable to load saved data.",
        error
      );
    }
  },

  escape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
