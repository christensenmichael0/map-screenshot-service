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

    output['basemap']['map_time'] = data['basemap']['map_times'][indx];
    delete output['basemap']['map_times'];

    // update valid_time in each overlay
    for (let i = 0; i < data['overlays'].length; i++) {
        output['overlays'][i]['valid_time'] = data['overlays'][i]['valid_times'][indx];
        delete output['overlays'][i]['valid_times'];
    }

    return {id, data: output};
};

module.exports = parsePayload;
