
// DEIMOS PROJECT
// Mission Intelligence Dashboard

function enableMissionDashboard() {

    const el = id => document.getElementById(id);

    const panel = el("mission-panel");

    if (!panel || el("mission-tabs")) return;

    const originalElements = [...panel.children];

   const categories = [

    { id: "overview", name: "Overview", icon: "◈" },
    { id: "terrain", name: "Terrain", icon: "▲" },
    { id: "radiation", name: "Radiation", icon: "☢" },
    { id: "environment", name: "Climate", icon: "◎" },
    { id: "routes", name: "Routes", icon: "⌖" },
    { id: "landing", name: "Landing", icon: "▼" },
    { id: "operations", name: "Operations", icon: "✦" }

];

    const navigation = document.createElement("nav");

    navigation.id = "mission-tabs";

    navigation.innerHTML = categories.map(tab => `

        <button data-mission-tab="${tab.id}">

            <span>${tab.icon}</span>

            <small>${tab.name}</small>

        </button>

    `).join("");

    const content = document.createElement("div");

    content.id = "mission-tab-content";

    const sections = {};

    categories.forEach(tab => {

        const section = document.createElement("section");

        section.className = "mission-tab-page";

        section.id = `mission-page-${tab.id}`;

        content.appendChild(section);

        sections[tab.id] = section;

    });

    panel.appendChild(navigation);
    panel.appendChild(content);


    // ORGANIZE EXISTING MODULES

    let currentTab = "overview";

    originalElements.forEach(element => {

        if (
            element.classList.contains("mission-panel-header") ||
            element.tagName === "H2"
        ) {
            return;
        }

        if (element.id === "rad-engine") {

            sections.radiation.appendChild(element);
            return;
        }

        if (element.id === "risk-assessment") {

            sections.environment.appendChild(element);
            return;
        }

        if (element.id === "route-comparison") {

            sections.routes.appendChild(element);
            return;
        }
        if (element.id === "landing-assessment") {

    sections.landing.appendChild(element);
    return;
}

if (element.id === "mission-operations") {

    sections.operations.appendChild(element);
    return;
}

        if (element.tagName === "H3") {

            const title = element.textContent
                .trim()
                .toUpperCase();

            if (title === "TERRAIN ANALYSIS") {
                currentTab = "terrain";
            }

            if (title === "WAYPOINT COORDINATES") {
                currentTab = "overview";
            }

        }

        sections[currentTab].appendChild(element);

    });


    // TAB NAVIGATION

    function selectTab(id) {

        if (!sections[id]) return;

        Object.entries(sections).forEach(([key, page]) => {

            page.hidden = key !== id;

        });

        navigation.querySelectorAll("button")
            .forEach(button => {

                const active =
                    button.dataset.missionTab === id;

                button.classList.toggle("active", active);

                button.setAttribute(
                    "aria-pressed", String(active)
                );

            });

        panel.scrollTop = 0;
    }

    navigation.querySelectorAll("button")
        .forEach(button => {

            button.addEventListener("click", () => {

                selectTab(button.dataset.missionTab);

            });

        });


    // SCIENTIFIC CHART INTERACTION

    const canvas = el("rad-chart");

    if (canvas) {

        const container = document.createElement("div");

        container.className = "interactive-chart";

        canvas.parentNode.insertBefore(container, canvas);

        container.appendChild(canvas);

        const tooltip = document.createElement("div");

        tooltip.className = "chart-tooltip";

        tooltip.hidden = true;

        container.appendChild(tooltip);


        // CREATE CHART INSPECTOR

        const inspector = document.createElement("div");

        inspector.className = "chart-inspector";

        inspector.textContent =
            "Move over the chart to inspect observations.";

        container.after(inspector);


        // INSPECT ORIGINAL NASA MEASUREMENTS

        canvas.addEventListener("pointermove", event => {

            if (typeof RAD === "undefined" || !RAD.loaded) {
                return;
            }

            const date = el("rad-date").value;

            const records = RAD.getRecords(date);

            if (!records.length) return;

            const rect = canvas.getBoundingClientRect();

            const x =
                (event.clientX - rect.left) *
                canvas.width / rect.width;

            const left = 65;
            const right = 18;

            const plotWidth =
                canvas.width - left - right;

            if (x < left || x > left + plotWidth) {

                tooltip.hidden = true;
                return;
            }

            const fraction = Math.min(

                1,

                Math.max(0, (x - left) / plotWidth)

            );

            const first = records[0].time;

            const last =
                records[records.length - 1].time;

            const target =
                first + fraction * (last - first);

            let nearest = records[0];

            records.forEach(record => {

                if (
                    Math.abs(record.time - target) <
                    Math.abs(nearest.time - target)
                ) {

                    nearest = record;
                }
            });

            tooltip.innerHTML = `

                <small>${nearest.date}</small>

                <strong>
                    ${nearest.doseRate.toFixed(2)} µGy/day
                </strong>

            `;

            tooltip.hidden = false;

            tooltip.style.left = Math.max(

                0,

                Math.min(

                    event.clientX - rect.left + 10,

                    rect.width - tooltip.offsetWidth

                )

            ) + "px";

            tooltip.style.top = "10px";

            inspector.textContent =

                `${new Date(nearest.time).toISOString()}
                 | ${nearest.doseRate.toFixed(2)} µGy/day`;

        });

        canvas.addEventListener("pointerleave", () => {

            tooltip.hidden = true;

        });
    }


    // QUICK ACCESS FROM TERRAIN SUMMARY

    const slope = el("mission-slope");

    if (slope) {

        const metric = slope.closest(".mission-metric");

        if (metric) {

            metric.style.cursor = "pointer";

            metric.title = "Open terrain analysis";

            metric.addEventListener("click", () => {

                selectTab("terrain");

            });
        }
    }


    // QUICK ACCESS TO RADIATION

    const radiation = el("mission-radiation");

    if (radiation) {

        const metric =
            radiation.closest(".mission-metric");

        if (metric) {

            metric.style.cursor = "pointer";

            metric.title = "Open radiation analysis";

            metric.addEventListener("click", () => {

                selectTab("radiation");

            });
        }
    }


    // QUICK ACCESS TO ENVIRONMENT

    const temperature = el("mission-temperature");

    if (temperature) {

        const metric =
            temperature.closest(".mission-metric");

        if (metric) {

            metric.style.cursor = "pointer";

            metric.title = "Open environmental assessment";

            metric.addEventListener("click", () => {

                selectTab("environment");

            });
        }
    }

    selectTab("overview");

    window.DEIMOS_DASHBOARD = {

        openTab: selectTab

    };

    console.log(
        "DEIMOS: Mission Intelligence Dashboard initialized."
    );
}
