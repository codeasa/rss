const fetch = require("node-fetch");

const adobeAPI = {
  version: 1
};

const jochekAPI = {
  url: "https://api.jochek.com/hk/verify",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "VqXLkyQYsM1a4uxoEEGkh4z7Kz0hFPBl8Udvm0fr"
  },
  body: {
    base64image: ""
  },
  async verify(body) {
    const data = {
      headers: this.headers,
      body: JSON.stringify(body),
      method: "POST"
    };
    //console.log({ data });

    const call = fetch(this.url, data);

    const data2 = await call.then((x) => x.json());

    return data2;
  }
};
//module.export = adobeAPI;
exports.adobeAPI = adobeAPI;
exports.jochekAPI = jochekAPI;
