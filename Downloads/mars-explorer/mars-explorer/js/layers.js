
// DEIMOS PROJECT
// Scientific Layers System

function enableScientificLayers(viewer, tileset) {

    const status = document.getElementById("layer-status");
    const information = document.getElementById("science-information");
    const opacity = document.getElementById("layer-opacity");
    const buttons = document.querySelectorAll("[data-layer]");

    const baseURL = "https://trek.nasa.gov/tiles/Mars/EQ";

    let currentLayer = null;
    let selectionVersion = 0;


    // NASA SCIENTIFIC DATASETS

    const datasets = {

        topography: {
            id: "Mars_MGS_MOLA_ClrShade_merge_global_463m",
            name: "MOLA Global Color Hillshade",
            mission: "Mars Global Surveyor",
            instrument: "Mars Orbiter Laser Altimeter",
            description: "Color representation of Martian relief.",
            resolution: "463 m/pixel",
            maximumLevel: 6
        },

        optical: {
            id: "Mars_Viking_MDIM21_ClrMosaic_global_232m",
            name: "Viking Global Color Mosaic",
            mission: "Viking Orbiters",
            instrument: "Visual Imaging System",
            description: "Global optical imagery of the Martian surface.",
            resolution: "232 m/pixel",
            maximumLevel: 7
        },
        ctx: {
    id: "CTX_beta01_uncontrolled_5m_Caltech",
    name: "CTX Global Mosaic",
    mission: "Mars Reconnaissance Orbiter",
    instrument: "Context Camera",
    description: "High-resolution optical imagery.",
    resolution: "5 m/pixel",
    maximumLevel: 11
}
    };


    // REMOVE CURRENT IMAGERY

    function removeCurrentLayer() {

        if (currentLayer) {

            tileset.imageryLayers.remove(currentLayer);
            currentLayer = null;

        }
    }


    // TEST NASA TILE FORMAT

    function testTile(url) {

        return new Promise(resolve => {

            const image = new Image();

            image.crossOrigin = "anonymous";

            const timer = setTimeout(() => resolve(false), 8000);

            const finish = result => {

                clearTimeout(timer);
                resolve(result);

            };

            image.onload = () => finish(true);
            image.onerror = () => finish(false);

            image.src = url;

        });
    }


    // LOAD NASA IMAGERY

    async function loadImagery(dataset, version) {

    const format = "jpg";

    if (version !== selectionVersion) return;
        removeCurrentLayer();

        const provider = new Cesium.UrlTemplateImageryProvider({

            url: `${baseURL}/${dataset.id}/1.0.0/default/default028mm/{z}/{y}/{x}.${format}`,

            tilingScheme: new Cesium.GeographicTilingScheme({

                ellipsoid: Cesium.Ellipsoid.MARS,
                numberOfLevelZeroTilesX: 2,
                numberOfLevelZeroTilesY: 1

            }),

            maximumLevel: dataset.maximumLevel,

            credit: `NASA / JPL / ${dataset.mission}`

        });

        provider.errorEvent.addEventListener(error => {

            console.error("NASA TILE ERROR:", error);

            status.textContent =
                "Some NASA imagery tiles could not be loaded.";

        });

        currentLayer =
            tileset.imageryLayers.addImageryProvider(provider);

        currentLayer.alpha = Number(opacity.value) / 100;

        status.textContent = `Selected: ${dataset.name}`;

        information.innerHTML = `

            <strong>${dataset.name}</strong>

            <p>Mission: ${dataset.mission}</p>
            <p>Instrument: ${dataset.instrument}</p>
            <p>Resolution: ${dataset.resolution}</p>
            <p>${dataset.description}</p>

            <a href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars"
               target="_blank" rel="noopener">
                NASA Dataset Documentation ↗
            </a>

        `;
    }


    // RADIATION MONITOR

    function showRadiationData() {

        status.textContent = "RAD historical observations";

        information.innerHTML = `

            <div class="radiation-monitor">

                <span class="rad-tag">
                    NASA / MSL / RAD
                </span>

                <h2>Radiation Monitor</h2>

                <p>Location: Gale Crater</p>
                <p>Period: August 2012 – June 2013</p>

                <div class="rad-metric">
                    <small>HISTORICAL DOSE RATE</small>
                    <strong>0.67</strong>
                    <span>mSv/day</span>
                </div>

                <div class="rad-metric">
                    <small>GCR ABSORBED DOSE RATE</small>
                    <strong>210</strong>
                    <span>µGy/day (approx.)</span>
                </div>

                <h3>EXPEDITION ESTIMATOR</h3>

                <label>
                    Mission duration:
                    <span id="rad-hours">6</span> hours
                </label>

                <input
                    type="range"
                    id="rad-duration"
                    min="1"
                    max="24"
                    value="6"
                >

                <div class="rad-metric rad-result">
                    <small>ESTIMATED EXPOSURE</small>
                    <strong id="rad-exposure">0.168</strong>
                    <span>mSv</span>
                </div>

                <h3>HISTORICAL SOLAR EVENT</h3>

                <div class="rad-event">
                    <strong>8,100 µGy</strong>
                    <p>May 20, 2024</p>
                    <p>Extreme solar storm detected by RAD.</p>
                </div>

                <div class="rad-warning">
                    Historical local observations and
                    simplified estimates. Not a global
                    radiation map or real-time forecast.
                    Does not account for spacesuit shielding.
                    Gy and Sv are not interchangeable.
                </div>

                <a href="https://science.nasa.gov/resource/radiation-measurements-on-mars/"
                   target="_blank" rel="noopener">
                    NASA Radiation Measurements ↗
                </a>

                <br><br>

                <a href="https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=MSL-M-RAD-3-RDR-V1.0"
                   target="_blank" rel="noopener">
                    NASA RAD Dataset ↗
                </a>

                <br><br>

                <a href="https://ciencia.nasa.gov/sistema-solar/marte-se-ilumina-durante-una-tormenta-solar-extrema/"
                   target="_blank" rel="noopener">
                    NASA Solar Storm Report ↗
                </a>

            </div>
        `;

        const duration =
            document.getElementById("rad-duration");

        function updateExposure() {

            const hours = Number(duration.value);

            const exposure = 0.67 * hours / 24;

            document.getElementById("rad-hours")
                .textContent = hours;

            document.getElementById("rad-exposure")
                .textContent = exposure.toFixed(3);

        }

        duration.addEventListener("input", updateExposure);

        updateExposure();


        // NAVIGATE TO GALE CRATER

        const gale = viewer.entities.getById("gale");

        if (gale) {

            viewer.selectedEntity = undefined;
            viewer.selectedEntity = gale;

        }

        console.log("DEIMOS: Radiation monitor enabled.");
    }


    // SCIENTIFIC LAYER BUTTONS

    buttons.forEach(button => {

        button.addEventListener("click", async () => {

            const version = ++selectionVersion;

            const previousActive = [...buttons].filter(
                item => item.classList.contains("active")
            );

            const type = button.dataset.layer;

            buttons.forEach(item => {

                if (
                    type !== "radiation" ||
                    item.dataset.layer === "radiation"
                ) {

                    item.classList.remove("active");

                }

            });

            button.classList.add("active");

            try {

                if (type === "base") {

                    removeCurrentLayer();

                    information.innerHTML = "";

                    status.textContent =
                        "Natural surface enabled";

                } else if (type === "radiation") {

                    showRadiationData();

                } else if (datasets[type]) {

                    await loadImagery(
                        datasets[type],
                        version
                    );

                }

            } catch (error) {

                if (version !== selectionVersion) return;

                buttons.forEach(item =>
                    item.classList.remove("active")
                );

                previousActive.forEach(item =>
                    item.classList.add("active")
                );

                console.error(
                    "SCIENTIFIC LAYER ERROR:",
                    error
                );

                status.textContent =
                    "Scientific layer could not be loaded.";

            }
        });
    });


    // LAYER OPACITY

    opacity.addEventListener("input", () => {

        if (currentLayer) {

            currentLayer.alpha =
                Number(opacity.value) / 100;

        }

    });


    // COLLAPSIBLE MENU

    const layersPanel =
        document.getElementById("science-layers");

    const toggleLayers =
        document.getElementById("toggle-layers");

    if (layersPanel && toggleLayers) {

        toggleLayers.addEventListener("click", () => {

            const collapsed = layersPanel.classList.toggle(
                "collapsed"
            );

            toggleLayers.textContent =
                collapsed ? "☰" : "−";

            toggleLayers.title = collapsed
                ? "Expand scientific layers"
                : "Minimize scientific layers";

            toggleLayers.setAttribute(
                "aria-expanded",
                String(!collapsed)
            );

        });
    }

    console.log("DEIMOS: Scientific layers initialized.");}