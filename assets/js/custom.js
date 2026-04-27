const trackFill = document.getElementById("trackFill");
const valueDisplay = document.getElementById("valueDisplay");
const stepsContainer = document.getElementById("steps");
const trackBg = document.getElementById("trackBg");
const rangeWrapper = document.getElementById("rangeWrapper");
const thumb = document.getElementById("thumb");

// Define your values for each step
const values = ["$0", "$5k", "$10k", "$15k", "$20k", "$25k", "$30k"];
const numberOfSteps = values.length;
let currentStep = 1; // Start at $5k
let isDragging = false;

// Create step dots
for (let i = 0; i < numberOfSteps; i++) {
  const step = document.createElement("div");
  step.className = "step";
  step.dataset.index = i;
  step.dataset.value = values[i];

  // Add click event to each step
  step.addEventListener("click", function (e) {
    e.stopPropagation();
    const stepIndex = parseInt(this.dataset.index);
    setToStep(stepIndex);
  });

  stepsContainer.appendChild(step);
}

const steps = document.querySelectorAll(".step");

// Function to set slider to a specific step
function setToStep(stepIndex) {
  currentStep = stepIndex;
  updateRange();
}

// Function to find nearest step based on percentage
function findNearestStep(clickPercentage) {
  let nearest = 0;
  let minDistance = Math.abs(clickPercentage - 0);

  for (let i = 0; i < numberOfSteps; i++) {
    const stepPercentage = (i / (numberOfSteps - 1)) * 100;
    const distance = Math.abs(clickPercentage - stepPercentage);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = i;
    }
  }

  return nearest;
}

// Add click event to track background and wrapper
function handleTrackClick(e) {
  if (e.target === thumb) return;

  const rect = rangeWrapper.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickPercentage = (clickX / rect.width) * 100;

  // Find and snap to nearest step
  const nearestStep = findNearestStep(clickPercentage);
  setToStep(nearestStep);
}

rangeWrapper.addEventListener("click", handleTrackClick);

// Drag functionality
thumb.addEventListener("mousedown", function (e) {
  isDragging = true;
  e.preventDefault();
});

document.addEventListener("mousemove", function (e) {
  if (!isDragging) return;

  const rect = rangeWrapper.getBoundingClientRect();
  let clickX = e.clientX - rect.left;

  // Constrain to track bounds
  clickX = Math.max(0, Math.min(clickX, rect.width));

  const clickPercentage = (clickX / rect.width) * 100;
  const nearestStep = findNearestStep(clickPercentage);
  setToStep(nearestStep);
});

document.addEventListener("mouseup", function () {
  isDragging = false;
});

// Update function
function updateRange() {
  const percentage = (currentStep / (numberOfSteps - 1)) * 100;

  // Update track fill
  trackFill.style.width = percentage + "%";

  // Update thumb position
  thumb.style.left = percentage + "%";

  // Update value display
  valueDisplay.textContent = values[currentStep];

  // Update step dots
  steps.forEach((step, i) => {
    if (i <= currentStep) {
      step.classList.add("active");
    } else {
      step.classList.remove("active");
    }
  });
}

// Initial update
updateRange();

const tabs = document.querySelectorAll(".plan-tab");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    // active tab remove
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    // content hide
    contents.forEach((c) => c.classList.remove("active"));

    // content show
    const id = tab.getAttribute("data-tab");
    document.getElementById(id).classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const list = document.querySelector(".payout-scroll ul");
  list.innerHTML += list.innerHTML; // duplicate items
});

const cards = document.querySelectorAll(".why-card");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show-card");
      }
    });
  },
  { threshold: 0.18 },
);

cards.forEach((card) => observer.observe(card));
