const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const FormData = require("form-data");
const jsPDF = require("jspdf");
const { jochekAPI } = require("./adobeAPI");
const cors = require("cors");

const app = express();
const port = 8080;

app.use(cors());
app.use(express.json({ limit: 10000000000 }));
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.send("TESTING2");
});

app.post("/idcheck", async (req, res) => {
  //console.log({ body: req.body });
  if (!req.body) return;
  const data = await jochekAPI.verify(req.body);

  res.send(data);
});

app.get("/pdf", async (req, res) => {
  generatePDF(req.query);
});

app.get("/signrequest", async (req, res) => {
  console.log("SING");
  if (!req.query.email) return;

  const { apiAccessPoint } = await callAPI("/api/rest/v6/baseUris");
  const transientDocumentId = await uploadFile(apiAccessPoint);

  await generatePDF(req.query);
  const params = `name=${req.query.name}&hkid=${req.query.hkid}`;

  const result = await sendAgreement(
    transientDocumentId,
    apiAccessPoint,
    [
      {
        email: req.query.email,
        password: req.query.hkid.trim()
      }
    ],
    params
  );

  //const url = await getSignURL(result.id, apiAccessPoint);
  const data = JSON.stringify(result);
  console.log({ result });

  res.send(
    `Email sent to ${req.query.email} <br> User Name: ${req.query.name} <br> HKID: ${req.query.hkid}, it is sign request password  <br>RAW Data:<pre>${data}</pre>`
  );
});

//-----------------------------------------------------------------

const getSignURL = async (id, apiAccessPoint) => {
  const url = `api/rest/v6/agreements/${id}`;
  const result = await callAPI(url, null, apiAccessPoint);

  return result;
};

const sendAgreement = async (
  transientDocumentId,
  apiAccessPoint,
  users,
  params
) => {
  const memberInfos = users.map((u) => {
    return {
      email: u.email,
      securityOption: {
        authenticationMethod: "PASSWORD",
        password: u.password
      }
    };
  });

  const body = {
    fileInfos: [
      {
        transientDocumentId
      }
    ],
    name: "Adobe Sign demo for Remote Signing",
    participantSetsInfo: [
      {
        memberInfos,
        order: 1,
        role: "SIGNER"
      }
    ],
    /*
    securityOption: {
      openPassword: "12345567"
    },
    */

    signatureType: "ESIGN",
    state: "IN_PROCESS",
    postSignOption: {
      redirectUrl: `https://731u1.csb.app/idchecker?${params}`
    }
  };

  const result = await callAPI(
    "/api/rest/v6/agreements",
    JSON.stringify(body),
    apiAccessPoint,
    "POST"
  );
  return result;
};

const uploadFile = async (apiAccessPoint) => {
  const filePath = `./files/pdf.pdf`;
  const form = new FormData();
  const fileStream = fs.createReadStream(filePath);
  form.append("File", fileStream);
  //  'File-Name': opts['fileName'],
  //  'Mime-Type': opts['mimeType'],
  //  'File': file
  const result = await callAPI(
    "/api/rest/v6/transientDocuments",
    form,
    apiAccessPoint,
    "POST",
    form.getHeaders()["content-type"],
    form
  );

  return result.transientDocumentId;
};

const callAPI = async (endpoint, body, host, method, contentType, formData) => {
  const apihost = host ? host : "https://api.na1.adobesign.com";

  const key =
    "Bearer 3AAABLblqZhCypt55N6crTsB8gFR3clNNQ8sP0ZCaC08rvNHv4Onuja2_1EZdLixdHgzwDkRUV_iqw-vvnnM8yu2cRFabmGIs";

  let content = {
    headers: {
      "cache-control": "no-cache",
      "content-type": contentType ? contentType : "application/json",
      Authorization: key
    },
    method: method ? method : "GET"
  };

  if (content.method !== "GET") {
    content.body = body;
    content.formData = formData;
  }
  //console.log({ url: `${apihost}${endpoint}`, content });

  return await (await fetch(`${apihost}${endpoint}`, content)).json();
};

const generatePDF = (query) => {
  var doc = new jsPDF.jsPDF();

  doc.text(`Hello ${query.name}, your ID: ${query.hkid}!`, 10, 200);
  doc.text("{{Sig_es_:signer1:signature}}", 30, 300);
  doc.save("./files/pdf.pdf");
};

app.listen(port, () => {
  // console.log(`Example app listening at http://localhost:${port}`);
});
