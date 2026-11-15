
// DEIMOS PROJECT
// NASA RAD Scientific Data Engine

const RAD = {

    source: "NASA / CDAWeb / MSL_RAD_OBS-L2",

    file: "data/rad/radiation.csv",

    records: [],

    invalidRecords: 0,

    loaded: false,

    async load() {

        if (this.loaded) return this.records;

        const response = await fetch(this.file);

        if (!response.ok) {

            throw new Error(
                `RAD file error: ${response.status}`
            );
        }

        const text = await response.text();

        const lines = text.split(/\r?\n/);

        this.records = [];
        this.invalidRecords = 0;

        const header = lines.find(
            line => line.startsWith("EPOCH_")
        );

        if (!header) {
            throw new Error("Invalid RAD CSV header.");
        }

        const columns = header.split(",");

        const detectorIndex = columns.indexOf(
            "TOTAL_DOSE_E_uGray/day_(good_Q)"
        );

        if (detectorIndex === -1) {
            throw new Error("RAD detector E column missing.");
        }

        for (const line of lines) {

            if (!/^\d{4}-\d{2}-\d{2}T/.test(line)) {
                continue;
            }

            const values = line.split(",");

            const timestamp = values[0];

            const raw = values[detectorIndex];

            const dose = raw?.trim()
                ? Number(raw)
                : NaN;

            // Ignore missing or invalid measurements.

            if (!Number.isFinite(dose) || dose < 0) {

                this.invalidRecords++;
                continue;
            }

            const normalizedTime = timestamp.replace(
                /(\.\d{3})\d+Z$/, "$1Z"
            );

            const time = Date.parse(normalizedTime);

            if (!Number.isFinite(time)) {

                this.invalidRecords++;
                continue;
            }

            this.records.push({

                timestamp: timestamp,
                time: time,
                date: timestamp.slice(0, 10),

                doseRate: dose

            });
        }

        this.records.sort((a, b) => a.time - b.time);

        if (!this.records.length) {

            throw new Error("No valid RAD observations.");
        }

        this.loaded = true;

        console.log(
            "RAD: NASA dataset loaded.",
            this.records.length,
            "valid observations."
        );

        return this.records;
    },


    // FILTER OBSERVATIONS BY DATE

    getRecords(date) {

        if (date === "all") return this.records;

        return this.records.filter(
            record => record.date === date
        );
    },


    // CALCULATE SCIENTIFIC STATISTICS

    getStatistics(records) {

        if (!records.length) return null;

        const values = records.map(
            record => record.doseRate
        );

        const sum = values.reduce(
            (total, value) => total + value, 0
        );

        const sorted = [...values].sort(
            (a, b) => a - b
        );

        const middle = Math.floor(sorted.length / 2);

        const median = sorted.length % 2

            ? sorted[middle]

            : (sorted[middle - 1] +
               sorted[middle]) / 2;

        return {

            count: values.length,

            mean: sum / values.length,

            median: median,

            min: Math.min(...values),

            max: Math.max(...values)

        };
    }
};


// DEIMOS RADIATION INTERFACE

function enableRadiationEngine() {

    const el = id => document.getElementById(id);

    const panel = el("mission-panel");

    if (!panel || el("rad-engine")) return;

    const section = document.createElement("section");

    section.id = "rad-engine";
    section.className = "rad-engine";

    section.innerHTML = `

        <h3>NASA RADIATION ANALYSIS</h3>

        <p class="rad-source">
            MSL / RAD / DETECTOR E
        </p>

        <button id="rad-load-data">
            Load NASA Dataset
        </button>

        <p id="rad-engine-status">
            Dataset not loaded.
        </p>

        <label>Historical observation date (UTC)</label>

        <select id="rad-date">

            <option value="all">
                All observations
            </option>

        </select>

        <div class="mission-metrics">

            <div class="mission-metric">
                <small>MEAN (µGy/day)</small>
                <strong id="rad-mean">—</strong>
            </div>

            <div class="mission-metric">
                <small>MAX (µGy/day)</small>
                <strong id="rad-max">—</strong>
            </div>

            <div class="mission-metric">
                <small>MIN (µGy/day)</small>
                <strong id="rad-min">—</strong>
            </div>

            <div class="mission-metric">
                <small>MEDIAN (µGy/day)</small>
                <strong id="rad-median">—</strong>
            </div>

        </div>

        <h3>HISTORICAL RADIATION PROFILE</h3>

        <canvas id="rad-chart"
                width="600"
                height="300">
        </canvas>

        <p id="rad-observations"></p>

        <h3>EXPEDITION DOSE SCENARIO</h3>

        <label>Reference dose rate</label>

        <select id="rad-scenario">

            <option value="mean">
                Historical sample mean
            </option>

            <option value="median">
                Historical median
            </option>

            <option value="max">
                Highest observed rate
            </option>

        </select>

        <p>
            Mission duration:
            <strong id="rad-mission-hours">—</strong>
        </p>

        <div class="rad-dose-result">

            <small>ESTIMATED ABSORBED DOSE</small>

            <strong id="rad-estimated-dose">—</strong>

            <span>µGy</span>

        </div>

        <div class="mission-warning">

            Historical Gale Crater observations.

            Dose estimates assume a constant rate
            for the entire expedition.

            Detector E absorbed dose is not equivalent
            to astronaut effective dose in mSv.

            Not a real-time radiation forecast.

        </div>

        <a href="https://cdaweb.gsfc.nasa.gov/"
           target="_blank" rel="noopener">

            NASA CDAWeb — Original Data Source

        </a>

    `;

    panel.appendChild(section);


    // LOAD LOCAL NASA FILE

    async function loadDataset() {

        const button = el("rad-load-data");

        button.disabled = true;

        el("rad-engine-status").textContent =
            "Loading NASA observations...";

        try {

            await RAD.load();

            const dates = [...new Set(

                RAD.records.map(record => record.date)

            )];

            el("rad-date").innerHTML =

                `<option value="all">
                    All observations
                 </option>` +

                dates.map(date =>

                    `<option value="${date}">
                        ${date}
                     </option>`

                ).join("");

            el("rad-engine-status").textContent =

                `Loaded: ${RAD.records.length} valid records.
                 ${RAD.invalidRecords} invalid records excluded.`;

            renderRadiation();

        } catch (error) {

            console.error("RAD ERROR:", error);

            el("rad-engine-status").textContent =
                error.message;

        } finally {

            button.disabled = false;
        }
    }


    // UPDATE SCIENTIFIC METRICS

    function renderRadiation() {

        if (!RAD.loaded) return;

        const records = RAD.getRecords(
            el("rad-date").value
        );

        const stats = RAD.getStatistics(records);

        if (!stats) return;

        el("rad-mean").textContent =
            stats.mean.toFixed(2);

        el("rad-max").textContent =
            stats.max.toFixed(2);

        el("rad-min").textContent =
            stats.min.toFixed(2);

        el("rad-median").textContent =
            stats.median.toFixed(2);

        el("rad-observations").textContent =
            `${stats.count} valid observations.`;

        drawChart(records);

        updateExposure();
    }


    // CONNECT TO EXPEDITION PLANNER

    function updateExposure() {

        if (!RAD.loaded) return;

        const duration = parseFloat(
            el("mission-duration")?.textContent
        );

        const useGale = el("mission-gale")?.checked;

        if (!Number.isFinite(duration) || !useGale) {

            el("rad-mission-hours").textContent = "—";

            el("rad-estimated-dose").textContent = "—";

            return;
        }

        const records = RAD.getRecords(
            el("rad-date").value
        );

        const stats = RAD.getStatistics(records);

        if (!stats) return;

        const scenario = el("rad-scenario").value;

        const rate = stats[scenario];

        // Constant-rate historical scenario.
        // µGy/day × hours / 24 = µGy.

        const dose = rate * duration / 24;

        el("rad-mission-hours").textContent =
            `${duration.toFixed(2)} h`;

        el("rad-estimated-dose").textContent =
            dose.toFixed(2);
    }


    // DRAW REAL NASA OBSERVATIONS

    function drawChart(records) {

        const canvas = el("rad-chart");

        const ctx = canvas.getContext("2d");

        const width = canvas.width;
        const height = canvas.height;

        const left = 65;
        const right = 18;
        const top = 25;
        const bottom = 40;

        const plotWidth = width - left - right;
        const plotHeight = height - top - bottom;

        const first = records[0].time;

        const last = records[records.length - 1].time;

        const timeRange = Math.max(last - first, 1);

        const maxDose = Math.max(
            ...records.map(record => record.doseRate)
        );

        const yMax = Math.max(
            100,
            Math.ceil(maxDose / 100) * 100
        );

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "#111B2E";

        ctx.fillRect(0, 0, width, height);

        ctx.font = "14px monospace";


        // GRID AND DOSE AXIS

        for (let i = 0; i <= 5; i++) {

            const value = yMax * i / 5;

            const y = top + plotHeight -
                plotHeight * i / 5;

            ctx.strokeStyle = "#334155";

            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(width - right, y);
            ctx.stroke();

            ctx.fillStyle = "#94A3B8";

            ctx.fillText(
                value.toFixed(0),
                5, y + 5
            );
        }


        // MEASUREMENT LINE

        ctx.strokeStyle = "#F28C45";
        ctx.lineWidth = 2;

        ctx.beginPath();

        records.forEach((record, index) => {

            const x = left +

                (record.time - first) /
                timeRange * plotWidth;

            const y = top + plotHeight -

                record.doseRate /
                yMax * plotHeight;

            // Do not connect long observation gaps.

            const gap = index > 0

                ? record.time -
                  records[index - 1].time

                : 0;

            if (index === 0 || gap > 1800000) {

                ctx.moveTo(x, y);

            } else {

                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();


        // AXIS LABELS

        ctx.fillStyle = "#94A3B8";
        ctx.font = "13px monospace";

        ctx.fillText("µGy/day", left, 16);

        ctx.fillText(
            records[0].date.slice(5),
            left,
            height - 14
        );

        ctx.fillText(
            records[records.length - 1].date.slice(5),
            width - 75,
            height - 14
        );
    }


    // EVENTS

    el("rad-load-data").addEventListener(
        "click", loadDataset
    );

    el("rad-date").addEventListener(
        "change", renderRadiation
    );

    el("rad-scenario").addEventListener(
        "change", updateExposure
    );

    el("mission-gale")?.addEventListener(
        "change", updateExposure
    );

    const durationElement = el("mission-duration");

    if (durationElement) {

        const observer = new MutationObserver(
            updateExposure
        );

        observer.observe(durationElement, {

            childList: true,
            characterData: true,
            subtree: true

        });
    }

    console.log(
        "DEIMOS: NASA Radiation Engine initialized."
    );
}
