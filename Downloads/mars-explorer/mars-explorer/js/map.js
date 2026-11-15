
console.log("DEIMOS: JavaScript iniciado");

Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IklRWEFWanMzckNPZi1lQ1ciLCJqdGkiOiI5YzJlNjk4OS1iZDE5LTRmOGEtYjk1YS1jMDY4YjMyM2E5NTAiLCJpZCI6NTQ5NTUwLCJzdWIiOiJWYWxlZ28iLCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoiZGVpbW9zLXByb2plY3QiLCJpYXQiOjE3OTQ2ODgxMTV9.HP-L1EhA2WNQLbx4sHt4yw3Y5_i5bTq7KHvsywRK3fc";

Cesium.Ellipsoid.default = Cesium.Ellipsoid.MARS;


async function initMars() {

    try {

        console.log("Inicializando Cesium...");

        const viewer = new Cesium.Viewer("cesiumContainer", {

            globe: false,
            sceneModePicker: false,
            baseLayerPicker: false,
            infoBox: false,
            selectionIndicator: false,
            geocoder: false,
            animation: false,
            timeline: false

        });

        window.viewer = viewer;

        console.log("Cesium inicializado correctamente");


        // LOAD MARS 3D TILESET

        const tileset = await Cesium.Cesium3DTileset
            .fromIonAssetId(3644333);

        viewer.scene.primitives.add(tileset);

        await viewer.zoomTo(tileset);


        // CORE SYSTEMS

        enableKeyboardControls(viewer);
        addMarsMarkers(viewer);
        enableMarkerSelection(viewer);


        // SCIENTIFIC AND MISSION MODULES

       
const modules = [

    {
        name: "Scientific Layers",
        init: () =>
            enableScientificLayers(viewer, tileset)
    },

    {
        name: "Expedition Planner",
        init: () =>
            enableMissionPlanner(viewer, tileset)
    },

    {
        name: "Risk Assessment",
        init: () =>
            enableRiskAssessment()
    },

    {
        name: "Route Comparison",
        init: () =>
            enableRouteComparison(viewer)
    },

    {
        name: "Radiation Data Engine",
        init: () =>
            enableRadiationEngine()
    },

    {
        name: "Landing Assessment",
        init: () =>
            enableLandingAssessment()
    },

    {
        name: "Advanced Mission Operations",
        init: () =>
            enableMissionOperations()
    },

    {
        name: "Mission Intelligence Dashboard",
        init: () =>
            enableMissionDashboard()
    },

    {
        name: "Voice Control",
        init: () =>
            enableVoiceControls(viewer, tileset)
    }

];



        // INITIALIZE MODULES

        let failedModules = 0;

        modules.forEach(module => {

            try {

                module.init();

                console.log(
                    `DEIMOS: ${module.name} initialized.`
                );

            } catch (error) {

                failedModules++;

                console.error(
                    `DEIMOS MODULE ERROR [${module.name}]:`,
                    error
                );
            }
        });


        // INITIALIZATION REPORT

        if (failedModules === 0) {

            console.log(
                "DEIMOS: All systems operational."
            );

        } else {

            console.warn(
                `DEIMOS: ${failedModules} module(s) failed.`
            );
        }

    } catch (error) {

        console.error("DEIMOS ERROR:", error);

    }
}




function enableKeyboardControls(viewer) {

    const keys = new Set();

    const controls = [
        "w", "a", "s", "d", "q", "e",
        "arrowup", "arrowdown",
        "arrowleft", "arrowright"
    ];

    document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();

        if (event.target.matches("input, textarea, select, [contenteditable]")) {
            return;
        }

        if (controls.includes(key)) {
            event.preventDefault();
            keys.add(key);
        }
    });

    document.addEventListener("keyup", (event) => {
        keys.delete(event.key.toLowerCase());
    });

    window.addEventListener("blur", () => {
        keys.clear();
    });

    viewer.clock.onTick.addEventListener(() => {

        const camera = viewer.camera;
        const speed = 0.015 ;

        const zoomSpeed = Math.max(
            10,
            camera.positionCartographic.height * 0.015
        );

        if (keys.has("w") || keys.has("arrowup")) {
            camera.rotateUp(speed);
        }

        if (keys.has("s") || keys.has("arrowdown")) {
            camera.rotateDown(speed);
        }

        if (keys.has("a") || keys.has("arrowleft")) {
            camera.rotateLeft(speed);
        }

        if (keys.has("d") || keys.has("arrowright")) {
            camera.rotateRight(speed);
        }

        if (keys.has("q")) {
            camera.zoomOut(zoomSpeed);
        }

        if (keys.has("e")) {
            camera.zoomIn(zoomSpeed);
        }
    });
}

function addMarsMarkers(viewer) {

    const ellipsoid = Cesium.Ellipsoid.MARS;

    marsLocations.forEach(location => {

        const color = Cesium.Color.fromCssColorString(
            location.color
        );

        viewer.entities.add({

            id: location.id,

            name: location.name,

            position: Cesium.Cartesian3.fromDegrees(
                location.lon,
                location.lat,
                40000,
                ellipsoid
            ),

            point: {
                pixelSize: 12,
                color: color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },

            label: {
                text: location.name,
                font: "14px Arial",
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16)
            },

            description: `
                <h2>${location.name}</h2>
                <p>${location.description}</p>
                <hr>
                <p>Category: ${location.category}</p>
                <p>Latitude: ${location.lat}°</p>
                <p>Longitude: ${location.lon}°</p>
            `
        });

    });

    console.log("DEIMOS: Mars markers loaded.");
}

function enableMarkerSelection(viewer) {

    viewer.selectedEntityChanged.addEventListener(entity => {

        if (!entity) return;

        const location = marsLocations.find(
            item => item.id === entity.id
        );

        if (!location) return;
showRegionPanel(location);
        viewer.camera.flyTo({

            destination: Cesium.Cartesian3.fromDegrees(
                location.lon,
                location.lat,
                450000,
                Cesium.Ellipsoid.MARS
            ),

            orientation: {
                heading: 0,
                pitch: Cesium.Math.toRadians(-90),
                roll: 0
            },

            duration: 2.5
        });

        console.log("Selected region:", location.name);
    });
}

function showRegionPanel(location) {

    document.getElementById("region-panel")
        .classList.remove("hidden");

    document.getElementById("region-name")
        .textContent = location.name;

    document.getElementById("region-category")
        .textContent = location.category;

    document.getElementById("region-description")
        .textContent = location.description;

    document.getElementById("region-lat")
        .textContent = `${location.lat}°`;

    document.getElementById("region-lon")
        .textContent = `${location.lon}°`;
}

const closePanel = document.getElementById("close-panel");

if (closePanel) {
    closePanel.addEventListener("click", () => {

        document.getElementById("region-panel")
            .classList.add("hidden");

        if (window.viewer) {
            window.viewer.selectedEntity = undefined;
        }
    });
}
initMars();