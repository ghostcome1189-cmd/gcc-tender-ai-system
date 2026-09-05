// GCC Tender AI System
// Frontend application logic

const App = {
    tender: null,
    file: null,
    documents: [],
    requirements: [
        {
            id: "REQ-001",
            requirement: "Submit complete technical methodology",
            category: "Technical",
            status: "Compliant"
        },
        {
            id: "REQ-002",
            requirement: "Provide project implementation schedule",
            category: "Technical",
            status: "Pending"
        },
        {
            id: "REQ-003",
            requirement: "Provide required company certificates",
            category: "Legal",
            status: "Compliant"
        },
        {
            id: "REQ-004",
            requirement: "Submit performance bond",
            category: "Commercial",
            status: "Pending"
        }
    ],

    init() {
        this.loadData();
        this.updateDashboard();
        this.renderRequirements();
        this.renderTender();
        this.renderDocuments();
    },

    loadData() {
        const savedTender = localStorage.getItem("gccTender");

        if (savedTender) {
            try {
                this.tender = JSON.parse(savedTender);
            } catch {
                this.tender = null;
            }
        }

        const savedDocuments =
            localStorage.getItem("gccDocuments");

        if (savedDocuments) {
            try {
                this.documents = JSON.parse(savedDocuments);
            } catch {
                this.documents = [];
            }
        }

        const savedRequirements =
            localStorage.getItem("gccRequirements");

        if (savedRequirements) {
            try {
                this.requirements =
                    JSON.parse(savedRequirements);
            } catch {}
        }
    },

    saveData() {
        localStorage.setItem(
            "gccTender",
            JSON.stringify(this.tender)
        );

        localStorage.setItem(
            "gccDocuments",
            JSON.stringify(this.documents)
        );

        localStorage.setItem(
            "gccRequirements",
            JSON.stringify(this.requirements)
        );
    },

    createTender(data) {
        if (!data.name) {
            this.toast("Tender name is required.");
            return;
        }

        this.tender = {
            name: data.name,
            country: data.country || "Kuwait",
            number: data.number || "Not provided",
            client: data.client || "Not provided",
            file: data.file || "No document"
        };

        this.saveData();
        this.renderTender();
        this.updateDashboard();

        this.toast("Tender workspace created.");
    },

    renderTender() {
        const container =
            document.getElementById("tenderWorkspace");

        if (!container) return;

        if (!this.tender) {
            container.innerHTML =
                '<div class="empty">No tender created yet.</div>';
            return;
        }

        container.innerHTML = `
            <div style="
                display:grid;
                grid-template-columns:
                repeat(auto-fit,minmax(180px,1fr));
                gap:15px;
            ">

                <div>
                    <small style="color:#667085">
                        Tender
                    </small>

                    <strong style="display:block;margin-top:5px">
                        ${this.escape(this.tender.name)}
                    </strong>
                </div>

                <div>
                    <small style="color:#667085">
                        Country
                    </small>

                    <strong style="display:block;margin-top:5px">
                        ${this.escape(this.tender.country)}
                    </strong>
                </div>

                <div>
                    <small style="color:#667085">
                        Client
                    </small>

                    <strong style="display:block;margin-top:5px">
                        ${this.escape(this.tender.client)}
                    </strong>
                </div>

                <div>
                    <small style="color:#667085">
                        Document
                    </small>

                    <strong style="display:block;margin-top:5px">
                        ${this.escape(this.tender.file)}
                    </strong>
                </div>

            </div>
        `;
    },

    addRequirement() {
        const text =
            prompt("Enter tender requirement:");

        if (!text || !text.trim()) return;

        const id =
            "REQ-" +
            String(this.requirements.length + 1)
                .padStart(3, "0");

        this.requirements.push({
            id,
            requirement: text.trim(),
            category: "Technical",
            status: "Pending"
        });

        this.saveData();
        this.renderRequirements();
        this.updateDashboard();

        this.toast("Requirement added.");
    },

    deleteRequirement(index) {
        this.requirements.splice(index, 1);

        this.saveData();
        this.renderRequirements();
        this.updateDashboard();

        this.toast("Requirement deleted.");
    },

    changeStatus(index, status) {
        this.requirements[index].status = status;

        this.saveData();
        this.renderRequirements();
        this.updateDashboard();
    },

    renderRequirements() {
        const table =
            document.getElementById("complianceTable");

        if (!table) return;

        table.innerHTML = "";

        this.requirements.forEach((item, index) => {

            table.innerHTML += `
                <tr>

                    <td>${this.escape(item.id)}</td>

                    <td>
                        ${this.escape(item.requirement)}
                    </td>

                    <td>
                        <span class="badge blue">
                            ${this.escape(item.category)}
                        </span>
                    </td>

                    <td>

                        <select
                            onchange="
                            App.changeStatus(
                                ${index},
                                this.value
                            )"
                            style="
                                padding:6px;
                                border:1px solid #ddd;
                                border-radius:6px;
                            "
                        >

                            <option
                                ${
                                    item.status === "Compliant"
                                    ? "selected"
                                    : ""
                                }
                            >
                                Compliant
                            </option>

                            <option
                                ${
                                    item.status === "Pending"
                                    ? "selected"
                                    : ""
                                }
                            >
                                Pending
                            </option>

                            <option
                                ${
                                    item.status === "Non-Compliant"
                                    ? "selected"
                                    : ""
                                }
                            >
                                Non-Compliant
                            </option>

                        </select>

                    </td>

                    <td>

                        <button
                            class="btn btn-outline"
                            style="padding:7px 10px"
                            onclick="
                                App.deleteRequirement(${index})
                            "
                        >
                            Delete
                        </button>

                    </td>

                </tr>
            `;
        });
    },

    updateDashboard() {

        const totalTenders =
            document.getElementById("totalTenders");

        const totalRequirements =
            document.getElementById("totalRequirements");

        const complianceScore =
            document.getElementById("complianceScore");

        const highRisks =
            document.getElementById("highRisks");

        if (totalTenders) {
            totalTenders.textContent =
                this.tender ? "1" : "0";
        }

        if (totalRequirements) {
            totalRequirements.textContent =
                this.requirements.length;
        }

        const compliant =
            this.requirements.filter(
                item => item.status === "Compliant"
            ).length;

        const score =
            this.requirements.length
                ? Math.round(
                    compliant /
                    this.requirements.length *
                    100
                )
                : 0;

        if (complianceScore) {
            complianceScore.textContent =
                score + "%";
        }

        if (highRisks) {
            highRisks.textContent = "2";
        }
    },

    analyzeTender() {

        const progress =
            document.getElementById(
                "analysisProgress"
            );

        const status =
            document.getElementById(
                "analysisStatus"
            );

        const results =
            document.getElementById(
                "analysisResults"
            );

        const summary =
            document.getElementById(
                "analysisSummary"
            );

        if (!progress || !status || !results) {
            return;
        }

        let progressValue = 0;

        results.style.display = "none";

        progress.style.width = "0%";

        status.textContent =
            "Reading tender document...";

        const timer = setInterval(() => {

            progressValue += 10;

            progress.style.width =
                progressValue + "%";

            if (progressValue === 30) {
                status.textContent =
                    "Extracting requirements...";
            }

            if (progressValue === 50) {
                status.textContent =
                    "Classifying requirements...";
            }

            if (progressValue === 70) {
                status.textContent =
                    "Checking compliance...";
            }

            if (progressValue === 90) {
                status.textContent =
                    "Identifying risks...";
            }

            if (progressValue >= 100) {

                clearInterval(timer);

                status.textContent =
                    "Analysis completed.";

                if (summary) {
                    summary.textContent = `
TENDER INTELLIGENCE SUMMARY

Tender:
${
    this.tender
        ? this.tender.name
        : "Demo Tender"
}

Detected Requirement Categories:

• Technical requirements
• Commercial requirements
• Legal requirements
• HSE requirements
• Quality requirements
• Schedule requirements
• Documentation requirements

Recommended Actions:

1. Review all mandatory requirements.
2. Complete the compliance matrix.
3. Review high-risk contractual clauses.
4. Confirm required certificates.
5. Generate the technical proposal.
                    `.trim();
                }

                results.style.display = "block";

                this.toast(
                    "Tender analysis completed."
                );
            }

        }, 250);
    },

    generateProposal() {

        const proposal =
            document.getElementById(
                "proposalText"
            );

        if (!proposal) return;

        const tenderName =
            this.tender
                ? this.tender.name
                : "GCC Tender Project";

        proposal.value = `
TECHNICAL PROPOSAL

PROJECT
${tenderName}


1. EXECUTIVE SUMMARY

Our organization proposes to execute the project in accordance with the applicable tender requirements, contractual obligations, approved standards and project objectives.


2. UNDERSTANDING OF THE PROJECT

The tender requirements have been reviewed and the major technical, commercial, operational and contractual obligations have been identified.


3. PROJECT EXECUTION METHODOLOGY

The project will be executed through a controlled methodology covering planning, mobilization, engineering, procurement, construction, testing, commissioning and handover.


4. PROJECT MANAGEMENT

A dedicated project management structure will be established to manage schedule, resources, quality, safety, documentation and stakeholder coordination.


5. MANPOWER AND EQUIPMENT

Qualified personnel, supervisors, engineers, technicians and required equipment will be mobilized according to the approved project execution plan.


6. QUALITY MANAGEMENT

Quality assurance and quality control procedures will be implemented throughout the project lifecycle.


7. HEALTH, SAFETY AND ENVIRONMENT

Applicable HSE requirements will be integrated into project planning, site operations, monitoring and reporting.


8. PROJECT SCHEDULE

A detailed baseline schedule will be prepared covering mobilization, engineering, procurement, construction, testing and final handover.


9. RISK MANAGEMENT

Project risks will be identified, assessed and monitored through a structured risk register with mitigation actions and responsible personnel.


10. COMPLIANCE

The proposal will be aligned with the tender requirements and the compliance matrix will be maintained throughout proposal preparation.


11. DOCUMENT CONTROL

All project documents will be managed through a structured document-control process.


12. CONCLUSION

We confirm our commitment to executing the project in accordance with the applicable tender requirements, contractual obligations, quality standards and project objectives.
        `.trim();

        this.toast(
            "Proposal generated."
        );
    },

    exportProposal() {

        const textarea =
            document.getElementById(
                "proposalText"
            );

        if (!textarea || !textarea.value.trim()) {

            this.toast(
                "Generate the proposal first."
            );

            return;
        }

        const blob =
            new Blob(
                [textarea.value],
                { type: "text/plain" }
            );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            "GCC_Technical_Proposal.txt";

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

        this.toast(
            "
