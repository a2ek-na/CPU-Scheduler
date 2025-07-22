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

  // Capture timing
  const startTime = timer;
  const endTime = startTime + job.burstTime;
  jobLog.push({
    id: job.id,
    burstTime: job.burstTime,
    arrivalTime: job.arrivalTime,
    startTime: startTime,
    completionTime: endTime,
  });

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
  const container     = document.getElementById('ganttContainer');
  const tableBody     = document.querySelector('#jobTable tbody');
  const avgTurnDOM    = document.getElementById('avgTurnaround');
  const avgWaitDOM    = document.getElementById('avgWaiting');
  const throughputDOM = document.getElementById('throughput');

  // Clear previous content
  container.innerHTML  = '';
  tableBody.innerHTML  = '';
  avgTurnDOM.textContent    = '–';
  avgWaitDOM.textContent    = '–';
  throughputDOM.textContent = '–';

  const totalTime = timer;    // total elapsed time when stopped
  const nJobs     = jobLog.length;

  let sumTurnaround = 0;
  let sumWaiting    = 0;

  // Build Gantt & Stats
  jobLog.forEach(job => {
    // —— Gantt Bar —— 
    const rowDiv = document.createElement('div');
    rowDiv.className = 'gantt-row';

    const labelDiv = document.createElement('div');
    labelDiv.className = 'gantt-label';
    labelDiv.textContent = job.id;

    const barDiv = document.createElement('div');
    barDiv.className = 'gantt-bar';
    const widthPct  = ((job.completionTime - job.startTime) / totalTime) * 100;
    const offsetPct = (job.startTime / totalTime) * 100;
    barDiv.style.width      = `${widthPct}%`;
    barDiv.style.marginLeft = `${offsetPct}%`;

    rowDiv.appendChild(labelDiv);
    rowDiv.appendChild(barDiv);
    container.appendChild(rowDiv);

    // —— Stats Table Row —— 
    const tr = document.createElement('tr');
    const turnaround    = job.completionTime - job.arrivalTime;
    const waiting       = turnaround - job.burstTime;

    // accumulate for summary
    sumTurnaround += turnaround;
    sumWaiting    += waiting;

    // create cells
    [
      job.id,
      job.burstTime,
      job.arrivalTime,
      job.startTime,
      job.completionTime,
      turnaround,
      waiting
    ].forEach(value => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  // —— Summary Metrics —— 
  if (nJobs > 0) {
    const avgTurn = (sumTurnaround / nJobs).toFixed(2);
    const avgWait = (sumWaiting / nJobs).toFixed(2);
    const tput    = (nJobs / totalTime).toFixed(3);

    avgTurnDOM.textContent    = avgTurn;
    avgWaitDOM.textContent    = avgWait;
    throughputDOM.textContent = tput;
  }

  // Reveal the whole Gantt & Stats section
  document.querySelector('.gantt-section').style.display = 'block';
}

