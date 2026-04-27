const fs = require("fs");

function formatTemplates(templates) {
  const formatted = {};
  const planNames = ["One-Step", "Two-Step", "Three-Step", "Instant"];

  planNames.forEach((plan) => {
    formatted[plan] = [];
  });

  const tempMap = {};

  templates.forEach((template) => {
    const planName = template?.plan?.name?.en;
    const phaseName = template?.phase?.name?.en;
    const price = template?.equity?.price;
    const uuid = template?.uuid;

    if (!planName || !price || !formatted.hasOwnProperty(planName)) return;

    if (!tempMap[planName]) tempMap[planName] = {};

    if (!tempMap[planName][price]) {
      tempMap[planName][price] = {
        price: price,
        equityPrice: template?.price,
        equityLabel: template?.equity?.name?.en || price,
        uuid,
        planName,
        phases: [],
      };
    }

    tempMap[planName][price].phases.push({
      type: phaseName === "Funded" ? "funded" : "phase",

      name: phaseName,

      uuid: template?.uuid || null,

      minTradingDays: template?.minTradingDays ?? null,

      maxTradingDays: template?.maxTradingDays ?? null,

      maxDailyLoss: template?.maxDailyLoss ?? null,

      maxOverallLoss: template?.maxOverallLoss ?? null,

      profitTarget: template?.profitTarget ?? null,

      maxProfitTarget: template?.maxProfitTarget ?? null,

      maxWithdrawal: template?.maxWithdrawal ?? null,

      consistency: template?.consistency ?? null,
    });
  });

  planNames.forEach((plan) => {
    formatted[plan] = Object.values(tempMap[plan] || {}).sort(
      (a, b) => Number(a.price) - Number(b.price),
    );
  });

  return formatted;
}

// 1. Read the input file
fs.readFile("input.json", "utf8", (err, jsonString) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  try {
    // 2. Parse the string into a JS Object
    const inputData = JSON.parse(jsonString);

    // 3. Run your formatting function
    const result = formatTemplates(inputData);

    // 4. Convert back to JSON and write to output.json
    // The 'null, 2' arguments make the JSON file readable (pretty-print)
    fs.writeFile("output.json", JSON.stringify(result, null, 2), (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log("Success! Check output.json for the results.");
      }
    });
  } catch (parseError) {
    console.error("Error parsing JSON string:", parseError);
  }
});
