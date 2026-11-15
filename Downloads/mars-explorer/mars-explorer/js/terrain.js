
// DEIMOS PROJECT
// NASA MOLA Terrain Engine

const MOLA = {

    source: "NASA / MGS / MOLA / MEGDR",

    file: "data/mola/megt00n090hb.img",

    columns: 11520,
    rows: 5632,

    pixelsPerDegree: 128,

    north: 0,
    south: -44,
    west: 90,
    east: 180,

    buffer: null,
    loading: null,


    // LOAD ORIGINAL NASA DATASET

    async load() {

        if (this.buffer) return;

        if (this.loading) return this.loading;

        this.loading = (async () => {

            console.log("MOLA: Loading NASA dataset...");

            const response = await fetch(this.file);

            if (!response.ok) {

                throw new Error(
                    `MOLA download failed: ${response.status}`
                );
            }

            const data = await response.arrayBuffer();

            const expected =
                this.columns * this.rows * 2;

            if (data.byteLength !== expected) {

                throw new Error(
                    `Invalid MOLA file size: ${data.byteLength}. Expected: ${expected}`
                );
            }

            this.buffer = new DataView(data);

            console.log("MOLA: NASA dataset loaded.");
            console.log("MOLA: Bytes:", data.byteLength);

        })();

        try {

            await this.loading;

        } finally {

            this.loading = null;

        }
    },


    // CHECK GEOGRAPHIC COVERAGE

    contains(latitude, longitude) {

        longitude = ((longitude % 360) + 360) % 360;

        return (

            latitude <= this.north &&
            latitude > this.south &&

            longitude >= this.west &&
            longitude < this.east

        );
    },


    // READ A SINGLE ELEVATION VALUE

    getElevation(latitude, longitude) {

        if (!this.buffer) {

            throw new Error("MOLA dataset not loaded.");

        }

        longitude = ((longitude % 360) + 360) % 360;

        if (!this.contains(latitude, longitude)) {

            return null;

        }

        const row = Math.floor(

            (this.north - latitude) *
            this.pixelsPerDegree

        );

        const column = Math.floor(

            (longitude - this.west) *
            this.pixelsPerDegree

        );

        const offset =
            (row * this.columns + column) * 2;

        // Signed 16-bit integer, Big Endian.

        return this.buffer.getInt16(offset, false);
    },


    // CONVERT CESIUM COORDINATES

    getCartographicElevation(point) {

        // MOLA uses planetocentric latitude.

        const ellipsoid = Cesium.Ellipsoid.MARS;

        const surface = ellipsoid.cartographicToCartesian(

            new Cesium.Cartographic(
                point.longitude,
                point.latitude,
                0
            )

        );

        const latitude = Cesium.Math.toDegrees(

            Math.atan2(
                surface.z,
                Math.hypot(surface.x, surface.y)
            )

        );

        const longitude = Cesium.Math.toDegrees(
            point.longitude
        );

        return this.getElevation(
            latitude,
            longitude
        );
    },


    // SAMPLE MULTIPLE ROUTE COORDINATES

    async sampleRoute(points) {

        await this.load();

        return points.map(point => ({

            longitude: point.longitude,
            latitude: point.latitude,

            height: this.getCartographicElevation(point)

        }));
    }
};

console.log("DEIMOS: NASA MOLA Engine initialized.");
