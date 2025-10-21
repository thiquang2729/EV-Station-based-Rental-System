const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const SAMPLE_DATA_PATH = path.join(__dirname, "..", "data", "stations.sample.json");
const DEFAULT_FALLBACK_URL = "http://localhost:3002/api/v1/stations";

const toBoolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes"].includes(String(value).toLowerCase());
};

const parseTargets = (rawTargets) =>
  (rawTargets || "")
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean);

const buildTargetUrl = (baseUrl, query) => {
  const target = new URL(baseUrl);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => target.searchParams.append(key, entry));
      return;
    }
    target.searchParams.set(key, value);
  });
  return target.toString();
};

const forwardHeadersFromRequest = (req) => {
  const headers = {};
  const forwardableHeaders = [
    "authorization",
    "x-request-id",
    "x-correlation-id",
    "accept",
    "accept-language",
  ];

  forwardableHeaders.forEach((header) => {
    if (req.headers[header]) {
      headers[header] = req.headers[header];
    }
  });

  return headers;
};

router.get("/", async (req, res) => {
  const targets = parseTargets(process.env.STATION_PROXY_TARGETS);
  const fallbackUrl = process.env.STATION_FALLBACK_URL || DEFAULT_FALLBACK_URL;
  const allowSampleFallback = toBoolean(process.env.STATION_SAMPLE_FALLBACK, true);

  const upstreams = targets.length > 0 ? targets : [fallbackUrl];
  const requestHeaders = forwardHeadersFromRequest(req);
  const errors = [];

  for (const upstream of upstreams) {
    try {
      const targetUrl = buildTargetUrl(upstream, req.query);
      const response = await fetch(targetUrl, {
        headers: requestHeaders,
      });

      if (!response.ok) {
        errors.push({
          upstream,
          status: response.status,
          statusText: response.statusText,
        });
        continue;
      }

      const payload = await response.json();
      return res.status(response.status).json(payload);
    } catch (error) {
      console.error(`Failed to fetch stations from ${upstream}`, error);
      errors.push({
        upstream,
        message: error.message,
      });
    }
  }

  if (allowSampleFallback) {
    try {
      const sample = fs.readFileSync(SAMPLE_DATA_PATH, "utf8");
      const stations = JSON.parse(sample);
      return res.status(200).json({ data: stations, source: "sample" });
    } catch (sampleError) {
      console.error("Failed to read stations sample file", sampleError);
    }
  }

  return res.status(502).json({
    message: "Unable to retrieve station data from upstream services",
    errors,
  });
});

module.exports = router;

