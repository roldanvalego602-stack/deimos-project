
// DEIMOS PROJECT
// Advanced Mission Operations

function enableMissionOperations() {

    const el = id => document.getElementById(id);
    const panel = el("mission-panel");

    if (!panel || el("mission-operations")) return;

    const sources = {

        topography:
            "https://pds-geosciences.wustl.edu/missions/mgs/megdr.html",

        radiation:
            "https://cdaweb.gsfc.nasa.gov/",

        temperature:
            "https://science.nasa.gov/resource/steady-temperatures-at-mars-gale-crater/",

        pressure:
            "https://science.nasa.gov/resource/first-pressure-readings-on-mars/",

        weather:
            "https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html",

        landing:
            "https://www.jpl.nasa.gov/news/press_kits/mars_2020/landing/mission/",

        geology:
            "https://science.nasa.gov/mission/msl-curiosity/science-highlights/"
    };

    const objectives = {

        yellowknife: {
            name: "Yellowknife Bay",
            description:
                "Study sedimentary rocks and evidence of ancient habitable environments.",
            region: "gale",
            source:
                "https://science.nasa.gov/resource/location-of-john-klein-drill-site/"
        },

        hottah: {
            name: "Hottah",
            description:
                "Investigate evidence of ancient flowing water.",
            region: "gale",
            source: sources.geology
        },

        sharp: {
            name: "Mount Sharp",
            description:
                "Investigate sedimentary layers and ancient environmental changes.",
            region: "gale",
            source: sources.geology
        },

        custom: {
            name: "Custom objective",
            description:
                "Define your own scientific investigation."
        }
    };

    let latestResources = null;
    let latestSite = null;

    const section = document.createElement("section");

    section.id = "mission-operations";
    section.className = "mission-operations";

    section.innerHTML = `

        <h3>ADVANCED MISSION OPERATIONS</h3>

        <nav class="operations-tabs">

            <button data-operation="resources">
                Life Support
            </button>

            <button data-operation="weather">
                Weather
            </button>

            <button data-operation="science">
                Science
            </button>

            <button data-operation="travel">
                Travel
            </button>

            <button data-operation="report">
                Report
            </button>

        </nav>


        <!-- LIFE SUPPORT -->

        <div data-operation-page="resources">

            <h2>Life Support System</h2>

            <p class="ops-note">
                Hypothetical equipment configuration.
                Not NASA-certified specifications.
            </p>

            <label>Oxygen capacity (kg)</label>

            <input id="ops-oxygen"
                   type="number" min="0.01"
                   step="0.1" value="1">

            <label>Oxygen consumption (kg/h)</label>

            <input id="ops-oxygen-rate"
                   type="number" min="0.01"
                   step="0.01" value="0.1">

            <label>Battery capacity (Wh)</label>

            <input id="ops-energy"
                   type="number" min="1"
                   value="2000">

            <label>Power consumption (W)</label>

            <input id="ops-power"
                   type="number" min="1"
                   value="180">

            <label>Water capacity (L)</label>

            <input id="ops-water"
                   type="number" min="0.01"
                   step="0.1" value="3">

            <label>Water consumption (L/h)</label>

            <input id="ops-water-rate"
                   type="number" min="0.01"
                   step="0.01" value="0.35">

            <label>
                Emergency reserve:
                <span id="ops-reserve-value">25%</span>
            </label>

            <input id="ops-reserve"
                   type="range"
                   min="0" max="50" value="25">

            <div class="ops-big-metric">

                <small>ESTIMATED OPERATIONAL AUTONOMY</small>

                <strong id="ops-autonomy">—</strong>

            </div>

            <div id="ops-resources"></div>

            <div id="ops-resource-status"
                 class="ops-status"></div>

        </div>


        <!-- WEATHER -->

        <div data-operation-page="weather" hidden>

            <h2>Martian Environment</h2>

            <p class="ops-source">
                NASA / MSL / REMS
            </p>

            <p>
                Historical observations from Gale Crater.
            </p>

            <div class="mission-metrics">

                <div class="mission-metric">
                    <small>AIR TEMPERATURE</small>
                    <strong>−70 / 0 °C</strong>
                    <p>Aug 2012 – Feb 2013</p>
                </div>

                <div class="mission-metric">
                    <small>ATMOSPHERIC PRESSURE</small>
                    <strong>690–780 Pa</strong>
                    <p>Aug 15–18, 2012</p>
                </div>

            </div>

            <h3>ENVIRONMENTAL CONDITIONS</h3>

            <div class="ops-info">
                <strong>Wind speed</strong>
                <p>Current observations unavailable.</p>
            </div>

            <div class="ops-info">
                <strong>Dust activity</strong>
                <p>Current conditions unknown.</p>
            </div>

            <div class="ops-info">
                <strong>Solar activity</strong>
                <p>No real-time forecast available.</p>
            </div>

            <p class="ops-note">
                These observations come from different
                historical periods and do not describe
                simultaneous or current conditions.
            </p>

            <a href="${sources.temperature}"
               target="_blank" rel="noopener">
                NASA Temperature Observations
            </a>

            <br><br>

            <a href="${sources.pressure}"
               target="_blank" rel="noopener">
                NASA Pressure Observations
            </a>

            <br><br>

            <a href="${sources.weather}"
               target="_blank" rel="noopener">
                NASA PDS REMS Dataset
            </a>

            <br><br>

            <a href="https://science.nasa.gov/resource/daily-cycles-of-radiation-and-pressure-at-gale-crater/"
               target="_blank" rel="noopener">
                Radiation and Atmospheric Pressure
            </a>

        </div>


        <!-- SCIENTIFIC OBJECTIVES -->

        <div data-operation-page="science" hidden>

            <h2>Scientific Objectives</h2>

            <label>Investigation target</label>

            <select id="ops-objective">

                <option value="yellowknife">
                    Yellowknife Bay
                </option>

                <option value="hottah">
                    Hottah
                </option>

                <option value="sharp">
                    Mount Sharp
                </option>

                <option value="custom">
                    Custom objective
                </option>

            </select>

            <div id="ops-objective-info"
                 class="ops-info"></div>

            <button id="ops-apply-objective">
                Apply Scientific Objective
            </button>

            <h3>SCIENTIFIC TASKS</h3>

            <label class="mission-checkbox">
                <input type="checkbox"
                       data-science-task="Geological observations">
                Geological observations
            </label>

            <label class="mission-checkbox">
                <input type="checkbox"
                       data-science-task="Sample collection">
                Sample collection
            </label>

            <label class="mission-checkbox">
                <input type="checkbox"
                       data-science-task="Photographic documentation">
                Photographic documentation
            </label>

            <label class="mission-checkbox">
                <input type="checkbox"
                       data-science-task="Environmental measurements">
                Environmental measurements
            </label>

            <p class="ops-note">
                Select exact route waypoints independently.
                Science targets do not assign precise coordinates.
            </p>

        </div>


        <!-- INTERPLANETARY TRAVEL -->

        <div data-operation-page="travel" hidden>

            <h2>Interplanetary Mission</h2>

            <p class="ops-source">
                NASA REFERENCE SCENARIOS
            </p>

            <div class="mission-metrics">

                <div class="mission-metric">
                    <small>MARS 2020 CRUISE</small>
                    <strong>203 days</strong>
                </div>

                <div class="mission-metric">
                    <small>MARS 2020 EDL</small>
                    <strong>7 min</strong>
                </div>

            </div>

            <h3>HYPOTHETICAL HUMAN MISSION</h3>

            <label>Outbound journey (days)</label>

            <input id="ops-outbound"
                   type="number" min="1" value="180">

            <label>Surface operations (days)</label>

            <input id="ops-surface"
                   type="number" min="0" value="500">

            <label>Return journey (days)</label>

            <input id="ops-return"
                   type="number" min="1" value="180">

            <div class="ops-big-metric">

                <small>TOTAL MISSION DURATION</small>

                <strong id="ops-travel-duration">
                    860 days
                </strong>

            </div>

            <div id="ops-travel-bar"></div>

            <p class="ops-note">
                Scenario durations are configurable.
                No orbital trajectory or human-rated
                landing simulation is performed.
            </p>

            <a href="${sources.landing}"
               target="_blank" rel="noopener">
                NASA Mars 2020 Mission Profile
            </a>

            <h3>LANDING SITE TERRAIN</h3>

            <p>
                Analyze the first expedition waypoint
                using the local NASA MOLA dataset.
            </p>

            <button id="ops-analyze-site">
                Evaluate Landing Terrain
            </button>

            <div id="ops-site-result"
                 class="ops-info">
                No site evaluated.
            </div>

        </div>


        <!-- MISSION REPORT -->

        <div data-operation-page="report" hidden>

            <h2>Mission Readiness</h2>

            <div id="ops-readiness"></div>

            <h3>MISSION REPORT</h3>

            <label>Mission name</label>

            <input id="ops-mission-name"
                   type="text"
                   value="DEIMOS Expedition 001">

            <button id="ops-export-json">
                Export Mission JSON
            </button>

            <button id="ops-export-report">
                Export Scientific Report
            </button>

            <div id="ops-export-status"
                 class="ops-status"></div>

            <p class="ops-note">
                Results are preliminary.
                Unknown hazards remain unevaluated.
            </p>

        </div>

    `;

    panel.appendChild(section);


    // TAB NAVIGATION

    function selectPage(name) {

        section.querySelectorAll("[data-operation-page]")
            .forEach(page => {

                page.hidden =
                    page.dataset.operationPage !== name;

            });

        section.querySelectorAll("[data-operation]")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.operation === name
                );

            });

        updateReadiness();
    }

    section.querySelectorAll("[data-operation]")
        .forEach(button => {

            button.addEventListener("click", () => {

                selectPage(button.dataset.operation);

            });
        });


    // READ NUMERIC VALUES

    function number(id) {

        const value = el(id)?.value;

        if (value === undefined || value.trim() === "") {
            return NaN;
        }

        return Number(value);
    }

    function metric(id) {

        const value = parseFloat(el(id)?.textContent);

        return Number.isFinite(value)
            ? value
            : null;
    }


    // LIFE SUPPORT CALCULATIONS

    function updateResources() {

        const duration = metric("mission-duration");

        const reserve = number("ops-reserve") / 100;

        el("ops-reserve-value").textContent =
            `${Math.round(reserve * 100)}%`;

        const resources = [

            {
                name: "Oxygen",
                capacity: number("ops-oxygen"),
                rate: number("ops-oxygen-rate"),
                unit: "kg",
                color: "#22D3EE"
            },

            {
                name: "Energy",
                capacity: number("ops-energy"),
                rate: number("ops-power"),
                unit: "Wh",
                color: "#A78BFA"
            },

            {
                name: "Water",
                capacity: number("ops-water"),
                rate: number("ops-water-rate"),
                unit: "L",
                color: "#72B1EF"
            }

        ];

        const valid = resources.every(resource =>

            Number.isFinite(resource.capacity) &&
            Number.isFinite(resource.rate) &&
            resource.capacity > 0 &&
            resource.rate > 0

        );

        if (!valid) {

            latestResources = null;

            el("ops-autonomy").textContent = "—";
            el("ops-resources").innerHTML = "";

            el("ops-resource-status").textContent =
                "Enter valid resource parameters.";

            return;
        }

        const autonomy = Math.min(

            ...resources.map(resource =>

                resource.capacity *
                (1 - reserve) /
                resource.rate

            )

        );

        el("ops-autonomy").textContent =
            `${autonomy.toFixed(2)} h`;

        const calculated = resources.map(resource => {

            const used = duration === null

                ? null

                : duration * resource.rate;

            const remaining = used === null

                ? null

                : resource.capacity - used;

            const limitExceeded = used !== null &&

                remaining <
                    resource.capacity * reserve;

            return {

                ...resource,
                used,
                remaining,
                limitExceeded

            };
        });


        el("ops-resources").innerHTML =

            calculated.map(resource => {

                const percentage =
                    resource.remaining === null

                        ? 100

                        : Math.max(
                            0,
                            resource.remaining /
                            resource.capacity * 100
                        );

                return `

                    <div class="ops-resource-card">

                        <strong style="color:${resource.color}">
                            ${resource.name}
                        </strong>

                        <div class="ops-progress">

                            <div style="
                                width:${percentage}%;
                                background:${
                                    resource.limitExceeded
                                    ? "#F87171"
                                    : resource.color
                                }
                            "></div>

                        </div>

                        <p>
                            ${
                                resource.remaining === null

                                ? "No expedition calculated."

                                : `${resource.remaining.toFixed(2)}
                                   / ${resource.capacity}
                                   ${resource.unit} remaining`
                            }
                        </p>

                    </div>

                `;
            }).join("");

        const margin = duration === null

            ? null

            : autonomy - duration;

        latestResources = {

            autonomy,
            duration,
            margin,
            reserve,
            resources: calculated,

            assumptions:
                "User-configured hypothetical equipment."
        };

        el("ops-resource-status").textContent =

            duration === null

                ? "Create a route to evaluate consumption."

                : margin >= 0

                    ? `Within configured resource limits.
                       Time margin: ${margin.toFixed(2)} h.`

                    : `Resource limit exceeded by
                       ${Math.abs(margin).toFixed(2)} h.`;

        el("ops-resource-status").style.color =

            margin === null

                ? "#94A3B8"

                : margin >= 0
                    ? "#34D399"
                    : "#F87171";
    }


    // SCIENTIFIC OBJECTIVES

    function updateObjective() {

        const objective =
            objectives[el("ops-objective").value];

        el("ops-objective-info").innerHTML = `

            <strong>${objective.name}</strong>

            <p>${objective.description}</p>

            ${objective.source

                ? `<a href="${objective.source}"
                      target="_blank" rel="noopener">
                      NASA Scientific Reference
                   </a>`

                : ""}

        `;
    }

    el("ops-objective").addEventListener(
        "change", updateObjective
    );

    el("ops-apply-objective").addEventListener(
        "click", () => {

            const objective =
                objectives[el("ops-objective").value];

            const input = el("mission-objective");

            if (
                input &&
                el("ops-objective").value !== "custom"
            ) {

                input.value =
                    objective.name + ": " +
                    objective.description;

                input.dispatchEvent(
                    new Event("input")
                );
            }

            updateReadiness();
        }
    );


    // INTERPLANETARY DURATION

    function updateTravel() {

        const outbound = number("ops-outbound");
        const surface = number("ops-surface");
        const returnDays = number("ops-return");

        if (
            ![outbound, surface, returnDays]
                .every(Number.isFinite) ||

            outbound <= 0 ||
            returnDays <= 0 ||
            surface < 0

        ) {

            el("ops-travel-duration").textContent = "—";
            el("ops-travel-bar").innerHTML = "";

            return null;
        }

        const total =
            outbound + surface + returnDays;

        el("ops-travel-duration").textContent =
            `${total.toFixed(0)} days`;

        el("ops-travel-bar").innerHTML = `

            <div class="ops-travel-bar">

                <span style="
                    width:${outbound / total * 100}%;
                    background:#22D3EE">
                </span>

                <span style="
                    width:${surface / total * 100}%;
                    background:#F28C45">
                </span>

                <span style="
                    width:${returnDays / total * 100}%;
                    background:#A78BFA">
                </span>

            </div>

            <p>Outbound: ${outbound} days</p>
            <p>Surface: ${surface} days</p>
            <p>Return: ${returnDays} days</p>

        `;

        return {

            outbound,
            surface,
            returnDays,
            total,
            hypothetical: true
        };
    }


    // LANDING SITE GRID ANALYSIS

    async function analyzeSite() {

        const mission =
            window.DEIMOS_MISSION?.getSnapshot();

        const report = el("ops-site-result");
        const button = el("ops-analyze-site");

        latestSite = null;

        if (!mission?.waypoints.length) {

            report.textContent =
                "Create an expedition waypoint first.";

            return;
        }

        const origin = mission.waypoints[0];

        const step = 1 / 128;

        const points = [];

        // Nine samples around the candidate location.

        for (let row = -1; row <= 1; row++) {

            for (let col = -1; col <= 1; col++) {

                points.push(

                    Cesium.Cartographic.fromDegrees(

                        origin.longitude + col * step,

                        origin.latitude + row * step

                    )
                );
            }
        }

        button.disabled = true;

        report.textContent =
            "Processing NASA MOLA elevations...";

        try {

            const results =
                await MOLA.sampleRoute(points);

            const heights = results.map(
                point => point?.height
            );

            if (!heights.every(Number.isFinite)) {

                throw new Error(
                    "Candidate site outside complete dataset coverage."
                );
            }


            // Calculate elevation differences.

            const minimum = Math.min(...heights);
            const maximum = Math.max(...heights);

            const relief = maximum - minimum;

            let maxSlope = 0;

            for (let i = 0; i < points.length; i++) {

                for (let j = i + 1;
                         j < points.length; j++) {

                    const rowA = Math.floor(i / 3);
                    const rowB = Math.floor(j / 3);

                    const colA = i % 3;
                    const colB = j % 3;

                    const adjacent =

                        Math.abs(rowA - rowB) +
                        Math.abs(colA - colB) === 1;

                    if (!adjacent) continue;

                    const geodesic =
                        new Cesium.EllipsoidGeodesic(

                            points[i],
                            points[j],
                            Cesium.Ellipsoid.MARS

                        );

                    const distance =
                        geodesic.surfaceDistance;

                    if (distance <= 0) continue;

                    const slope =

                        Math.atan(

                            Math.abs(
                                heights[j] - heights[i]
                            ) / distance

                        ) * 180 / Math.PI;

                    maxSlope = Math.max(
                        maxSlope, slope
                    );
                }
            }

            latestSite = {

                latitude: origin.latitude,
                longitude: origin.longitude,
                elevation: heights[4],

                minElevation: minimum,
                maxElevation: maximum,

                relief,
                maxSampledSlope: maxSlope,

                samples: heights,

                source: "NASA MGS MOLA MEGDR",

                suitability: "Undetermined"
            };

            report.innerHTML = `

                <div class="mission-metrics">

                    <div class="mission-metric">
                        <small>SITE ELEVATION</small>
                        <strong>${heights[4]} m</strong>
                    </div>

                    <div class="mission-metric">
                        <small>LOCAL RELIEF</small>
                        <strong>${relief} m</strong>
                    </div>

                    <div class="mission-metric">
                        <small>MAX. SAMPLED SLOPE</small>
                        <strong>${maxSlope.toFixed(2)}°</strong>
                    </div>

                    <div class="mission-metric">
                        <small>MOLA SAMPLES</small>
                        <strong>9</strong>
                    </div>

                </div>

                <p>Latitude:
                    ${origin.latitude.toFixed(5)}°
                </p>

                <p>Longitude:
                    ${origin.longitude.toFixed(5)}°
                </p>

                <p class="ops-note">
                    Coarse regional terrain assessment.
                    Small hazards remain unresolved.
                    Landing suitability is undetermined.
                </p>

            `;

        } catch (error) {

            latestSite = null;
            report.textContent = error.message;

            console.error("DEIMOS SITE ERROR:", error);

        } finally {

            button.disabled = false;
            updateReadiness();
        }
    }


    // MISSION READINESS CHECKLIST

    function updateReadiness() {

        const mission =
            window.DEIMOS_MISSION?.getSnapshot();

        const checks = [

            {
                name: "Expedition route defined",
                ready: (mission?.waypoints.length || 0) >= 2
            },

            {
                name: "Scientific objective defined",
                ready: Boolean(mission?.objective?.trim())
            },

            {
                name: "Terrain analysis completed",
                ready: Number.isFinite(mission?.slope)
            },

            {
                name: "NASA RAD observations loaded",
                ready:
                    typeof RAD !== "undefined" &&
                    RAD.loaded
            },

            {
                name: "Historical radiation estimate",
                ready:
                    Number.isFinite(mission?.radiation)
            },

            {
                name: "Return route included",
                ready:
                    Boolean(mission?.roundTrip) &&
                    (mission?.waypoints.length || 0) >= 2
            },

            {
                name: "Configured resource limits",
                ready:
                    Number.isFinite(latestResources?.margin) &&
                    latestResources.margin >= 0
            },

            {
                name: "Landing terrain evaluated",
                ready: Boolean(latestSite)
            }

        ];

        const count = checks.filter(check =>
            check.ready
        ).length;

        el("ops-readiness").innerHTML = `

            <div class="ops-big-metric">

                <small>PLANNING TASKS COMPLETED</small>

                <strong>${count}/${checks.length}</strong>

            </div>

            ${checks.map(check => `

                <div class="ops-check">

                    <span>${check.name}</span>

                    <strong style="
                        color:${check.ready
                            ? "#34D399"
                            : "#94A3B8"}
                    ">

                        ${check.ready
                            ? "Complete"
                            : "Pending"}

                    </strong>

                </div>

            `).join("")}

            <p class="ops-note">
                Checklist completion does not establish
                astronaut safety or mission readiness
                for real operations.
            </p>

        `;
    }


    // BUILD EXPORTABLE SCIENTIFIC DATA

    function buildReport() {

        updateResources();

        const mission =
            window.DEIMOS_MISSION?.getSnapshot();

        if (!mission || mission.waypoints.length < 2) {

            throw new Error(
                "Create an expedition route before exporting."
            );
        }

        let radiation = null;

        if (
            typeof RAD !== "undefined" &&
            RAD.loaded
        ) {

            const date =
                el("rad-date")?.value || "all";

            const records =
                RAD.getRecords(date);

            radiation = {

                observationDate: date,

                statistics:
                    RAD.getStatistics(records),

                scenario:
                    el("rad-scenario")?.value,

                estimatedAbsorbedDoseUGy:
                    metric("rad-estimated-dose"),

                location:
                    "Gale Crater",

                unit:
                    "microgray per Earth day",

                historical: true
            };
        }

        return {

            project: "DEIMOS PROJECT",

            team: "ORBITRON V2",

            missionName:
                el("ops-mission-name").value,

            generatedAt:
                new Date().toISOString(),

            expedition: {

                ...mission,

                waypoints: mission.waypoints.map(
                    point => ({

                        latitude: point.latitude,
                        longitude: point.longitude,
                        modelHeight: point.height

                    })
                )
            },

            scientificTasks: [

                ...section.querySelectorAll(
                    "[data-science-task]:checked"
                )

            ].map(input =>
                input.dataset.scienceTask
            ),

            resources: latestResources,

            radiation,

            historicalWeather:
                mission.galeReference

                    ? {

                        location: "Gale Crater",

                        temperatureC: [-70, 0],

                        temperaturePeriod:
                            "2012-08 to 2013-02",

                        pressurePa: [690, 780],

                        pressurePeriod:
                            "2012-08-15 to 2012-08-18",

                        currentConditions: null
                    }

                    : null,

            interplanetaryScenario:
                updateTravel(),

            landingReference: {

                mission: "NASA Mars 2020",
                cruiseDays: 203,
                edlMinutesApprox: 7
            },

            landingSite: latestSite,

            sources,

            limitations: [

                "Experimental planning prototype.",

                "No certified life support specifications.",

                "No real-time environmental forecast.",

                "MOLA cannot resolve small surface hazards.",

                "Historical radiation is not a safety prediction.",

                "Landing suitability remains undetermined."

            ]
        };
    }


    // DOWNLOAD LOCAL FILE

    function downloadFile(name, content, type) {

        const blob = new Blob(
            [content],
            { type: type }
        );

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;
        anchor.download = name;

        document.body.appendChild(anchor);

        anchor.click();
        anchor.remove();

        setTimeout(() => {

            URL.revokeObjectURL(url);

        }, 1000);
    }


    // EXPORT JSON

    el("ops-export-json").addEventListener(
        "click", () => {

            try {

                const report = buildReport();

                downloadFile(

                    "deimos-mission.json",

                    JSON.stringify(report, null, 2),

                    "application/json"

                );

                el("ops-export-status").textContent =
                    "JSON mission report generated.";

            } catch (error) {

                el("ops-export-status").textContent =
                    error.message;
            }
        }
    );


    // EXPORT SCIENTIFIC TEXT REPORT

    el("ops-export-report").addEventListener(
        "click", () => {

            try {

                const report = buildReport();

                const mission = report.expedition;

                const lines = [

                    "DEIMOS PROJECT",

                    "SCIENTIFIC EXPEDITION REPORT",

                    report.missionName,

                    report.generatedAt,

                    "",

                    "SCIENTIFIC OBJECTIVE",

                    mission.objective || "Not defined",

                    "",

                    "EXPEDITION ANALYSIS",

                    `Distance: ${mission.distance ?? "N/A"} km`,

                    `Duration: ${mission.duration ?? "N/A"} h`,

                    `Sampled slope: ${mission.slope ?? "N/A"} degrees`,

                    `Historical equivalent dose estimate: ${mission.radiation ?? "N/A"} mSv`,

                    "",

                    "TERRAIN ANALYSIS",

                    mission.terrainReport,

                    "",

                    "WAYPOINTS",

                    ...mission.waypoints.map((point, i) =>

                        `${i + 1}: LAT ${point.latitude}, LON ${point.longitude}`

                    ),

                    "",

                    "SCIENTIFIC TASKS",

                    ...report.scientificTasks,

                    "",

                    "LIFE SUPPORT SCENARIO",

                    JSON.stringify(report.resources, null, 2),

                    "",

                    "NASA RAD HISTORICAL ANALYSIS",

                    JSON.stringify(report.radiation, null, 2),

                    "",

                    "HISTORICAL WEATHER",

                    JSON.stringify(report.historicalWeather, null, 2),

                    "",

                    "INTERPLANETARY SCENARIO",

                    JSON.stringify(report.interplanetaryScenario, null, 2),

                    "",

                    "LANDING SITE",

                    JSON.stringify(report.landingSite, null, 2),

                    "",

                    "SCIENTIFIC SOURCES",

                    ...Object.entries(sources).map(

                        ([name, url]) => `${name}: ${url}`

                    ),

                    "",

                    "LIMITATIONS",

                    ...report.limitations

                ];

                downloadFile(

                    "deimos-scientific-report.txt",

                    lines.join("\n"),

                    "text/plain;charset=utf-8"

                );

                el("ops-export-status").textContent =
                    "Scientific report generated.";

            } catch (error) {

                el("ops-export-status").textContent =
                    error.message;
            }
        }
    );


    // AUTOMATIC UPDATES

    function refresh() {

        updateResources();
        updateReadiness();
    }

    section.querySelectorAll(
        "input[type=number], input[type=range]"
    ).forEach(input => {

        input.addEventListener("input", () => {

            refresh();
            updateTravel();

        });
    });

    const observer = new MutationObserver(refresh);

    [

        "mission-duration",
        "mission-distance",
        "mission-slope",
        "mission-radiation",
        "mission-points",
        "rad-engine-status"

    ].forEach(id => {

        const element = el(id);

        if (element) {

            observer.observe(element, {

                childList: true,
                characterData: true,
                subtree: true

            });
        }
    });

    el("mission-objective")?.addEventListener(
        "input", updateReadiness
    );

    el("mission-return")?.addEventListener(
        "change", updateReadiness
    );

    el("ops-analyze-site").addEventListener(
        "click", analyzeSite
    );

    // Remove stale landing results after route changes.

    const routeObserver = new MutationObserver(() => {

        latestSite = null;

        el("ops-site-result").textContent =
            "Route changed. Evaluate the new candidate site.";

        updateReadiness();
    });

    const waypointList = el("mission-waypoints");

    if (waypointList) {

        routeObserver.observe(waypointList, {

            childList: true,
            subtree: true

        });
    }


    // PUBLIC OPERATIONS API

    window.DEIMOS_OPERATIONS = {

        openPage: selectPage,

        getReport: buildReport

    };

    updateObjective();
    updateTravel();
    refresh();

    selectPage("resources");

    console.log(
        "DEIMOS: Advanced Mission Operations initialized."
    );
}
