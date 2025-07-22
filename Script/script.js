console.log("CPU Schedular Simulator Loaded...");
let selectedAlgorithm = null;
let timer = 0;
let timerInterval = null;

document.getElementById('startButton').addEventListener('click', () => {
  const algo = document.getElementById('algorithmSelect').value;

  if (!algo) {
    alert('Please select a scheduling algorithm!');
    return;
  }

  selectedAlgorithm = algo;
  console.log("Selected Algorithm:", selectedAlgorithm);

  // Start the timer
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById('timer').innerText = timer;
  }, 1000);

  // Show the job section
  document.querySelector('.job-section').style.display = 'block';

  // Disable further selection
  document.getElementById('algorithmSelect').disabled = true;
  document.getElementById('startButton').disabled = true;
});

const readyQueue = [];
let isProcessing = false;
let jobId = 1;

// —————— Timer & Setup ——————
document.getElementById('startButton').addEventListener('click', () => {
  const algo = document.getElementById('algorithmSelect').value;
  if (!algo) {
    alert('Please select a scheduling algorithm!');
    return;
  }
  selectedAlgorithm = algo;
  timerInterval = setInterval(() => {
    timer++;
    document.getElementById('timer').innerText = timer;
  }, 1000);
  document.querySelector('.job-section').style.display = 'block';
  document.getElementById('algorithmSelect').disabled = true;
  document.getElementById('startButton').disabled = true;
});

// —————— Add Job ——————
document.getElementById('addJobButton').addEventListener('click', () => {
  const burstTime = prompt("Enter Burst Time for Job " + jobId);
  if (!burstTime || isNaN(burstTime) || burstTime <= 0) {
    alert("Please enter a valid positive number for burst time.");
    return;
  }

  const job = {
    id: "J" + jobId,
    burstTime: parseInt(burstTime),
    arrivalTime: timer
  };
  jobId++;
  addToReadyQueue(job);
});

function addToReadyQueue(job) {
  // Track in array
  readyQueue.push(job);

  // Show in DOM
  const li = document.createElement('li');
  li.textContent = `${job.id} (BT: ${job.burstTime}, AT: ${job.arrivalTime})`;
  document.getElementById('readyList').appendChild(li);

  // Kick off processing if idle
  startProcessing();
}

// —————— FCFS Execution Engine ——————
function startProcessing() {
  if (isProcessing || readyQueue.length === 0) return;

  const job = readyQueue.shift();
  isProcessing = true;

  // Move to Processing queue
  document.getElementById('processingList').innerHTML =
    `<li>${job.id} (BT: ${job.burstTime})</li>`;

  // Remove from Ready list (first child)
  const readyList = document.getElementById('readyList');
  if (readyList.firstElementChild) readyList.removeChild(readyList.firstElementChild);

  // Simulate burst
  setTimeout(() => {
    // Clear Processing list
    document.getElementById('processingList').innerHTML = "";

    // Append to Completed
    const doneLi = document.createElement('li');
    doneLi.textContent = `${job.id} ✅`;
    document.getElementById('completedList').appendChild(doneLi);

    isProcessing = false;
    // Process next job
    startProcessing();
  }, job.burstTime * 1000);
}


// ─── LOGGING FOR GANTT ───────────────────────────────────
const jobLog = [];
let stopRequested = false;

// Modify startProcessing to record start/end
function startProcessing() {
  if (isProcessing || readyQueue.length === 0 || stopRequested) return;

  const job = readyQueue.shift();
  isProcessing = true;

  // Record start & end for Gantt
  const startTime = timer;
  const endTime = startTime + job.burstTime;
  jobLog.push({ id: job.id, start: startTime, end: endTime });

  // Update DOM
  document.getElementById('processingList').innerHTML =
    `<li>${job.id} (BT: ${job.burstTime})</li>`;
  const readyList = document.getElementById('readyList');
  if (readyList.firstElementChild) readyList.removeChild(readyList.firstElementChild);

  // Simulate
  setTimeout(() => {
    document.getElementById('processingList').innerHTML = "";
    const doneLi = document.createElement('li');
    doneLi.textContent = `${job.id} ✅`;
    document.getElementById('completedList').appendChild(doneLi);

    isProcessing = false;
    startProcessing();
  }, job.burstTime * 1000);
}

// ─── STOP BUTTON LOGIC ───────────────────────────────────
document.getElementById('stopButton').addEventListener('click', () => {
  // stop the timer
  clearInterval(timerInterval);
  stopRequested = true;

  // disable buttons
  document.getElementById('addJobButton').disabled = true;
  document.getElementById('stopButton').disabled = true;

  // render Gantt
  renderGanttChart();
});

function renderGanttChart() {
  const container = document.getElementById('ganttContainer');
  container.innerHTML = '';                   // clear if re-render
  const totalTime = timer;                    // final time when stopped

  jobLog.forEach(({ id, start, end }) => {
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const label = document.createElement('div');
    label.className = 'gantt-label';
    label.textContent = id;

    const bar = document.createElement('div');
    bar.className = 'gantt-bar';
    // width & offset as percentages of totalTime
    const widthPct = ((end - start) / totalTime) * 100;
    const offsetPct = (start / totalTime) * 100;
    bar.style.width = `${widthPct}%`;
    bar.style.marginLeft = `${offsetPct}%`;

    row.appendChild(label);
    row.appendChild(bar);
    container.appendChild(row);
  });

  // show the section
  document.querySelector('.gantt-section').style.display = 'block';
}
