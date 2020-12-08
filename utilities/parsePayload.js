/**
 * Assembles an object that has the same structure as that of a single image request payload
 * from an a multi-image payload (animation)
 *
 * @param indx
 * @param data
 * @return {any}
 */
const parsePayload = (indx, payload) => {

    const {id, data} = payload;
    let output = JSON.parse(JSON.stringify(data));

    output['basemap']['map_time'] = data['basemap']['map_time'][indx];

    // update valid_time in each overlay
    for (let i = 0; i < data['overlays'].length; i++) {
        output['overlays'][i]['url'] = data['overlays'][i]['url'][indx];
        output['overlays'][i]['labels'] = data['overlays'][i]['labels'][indx];
    }

    return {id, data: output};
};

module.exports = parsePayload;
