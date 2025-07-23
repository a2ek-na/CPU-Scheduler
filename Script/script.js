console.log("CPU Scheduler Simulator Loaded…");

// ─── Global State ─────────────────────────────────────────
let selectedAlgorithm = null;
let timer             = 0;
let timerInterval     = null;
let jobId             = 1;
let isProcessing      = false;
let stopRequested     = false;

const readyQueue = [];
const jobLog     = []; // will store { id, burstTime, arrivalTime, startTime, completionTime }

// ─── UI Elements ──────────────────────────────────────────
const algoSelect   = document.getElementById('algorithmSelect');
const startBtn     = document.getElementById('startButton');
const addJobBtn    = document.getElementById('addJobButton');
const stopBtn      = document.getElementById('stopButton');
const timerDisplay = document.getElementById('timer');
const readyListDOM = document.getElementById('readyList');
const procListDOM  = document.getElementById('processingList');
const compListDOM  = document.getElementById('completedList');

// Summary spans
const avgTurnDOM    = document.getElementById('avgTurnaround');
const avgWaitDOM    = document.getElementById('avgWaiting');
const throughputDOM = document.getElementById('throughput');

// ─── Start Timer & Lock In Algorithm ─────────────────────
startBtn.addEventListener('click', () => {
  const algo = algoSelect.value;
  if (!algo) {
    alert('Please select a scheduling algorithm!');
    return;
  }
  selectedAlgorithm = algo;
  algoSelect.disabled = true;
  startBtn.disabled   = true;
  document.querySelector('.job-section').style.display = 'flex';

  // Start the global timer
  timerInterval = setInterval(() => {
    timer++;
    timerDisplay.innerText = timer;
  }, 1000);
});

// ─── Add Job Handler ──────────────────────────────────────
addJobBtn.addEventListener('click', () => {
  // Get burst time
  const burst = prompt(`Enter Burst Time for Job J${jobId}`);
  if (!burst || isNaN(burst) || burst <= 0) {
    alert('Please enter a valid positive number for burst time.');
    return;
  }
  const burstTime = parseInt(burst, 10);

  // Get priority if needed
  let priority = null;
  if (selectedAlgorithm === 'Priority') {
    const pr = prompt(`Enter Priority (lower = higher) for Job J${jobId}`);
    if (pr === null || isNaN(pr)) {
      alert('Invalid priority—job cancelled.');
      return;
    }
    priority = parseInt(pr, 10);
  }

  // Build job object
  const job = {
    id:          'J' + jobId,
    burstTime,
    arrivalTime: timer,
    priority     // may be null for non-Priority algos
  };
  jobId++;

  // Enqueue and refresh UI
  readyQueue.push(job);
  refreshReadyQueueUI();
  // Kick off if idle
  startProcessing();
});

// ─── Core Processing Engine ───────────────────────────────
function startProcessing() {
  if (isProcessing || readyQueue.length === 0 || stopRequested) return;

  // 1) Select next job index
  let idx = 0;
  if (selectedAlgorithm === 'SJF') {
    idx = readyQueue.reduce((minIdx, job, i) =>
      job.burstTime < readyQueue[minIdx].burstTime ? i : minIdx
    , 0);
  } else if (selectedAlgorithm === 'Priority') {
    idx = readyQueue.reduce((minIdx, job, i) =>
      job.priority < readyQueue[minIdx].priority ? i : minIdx
    , 0);
  }
  // FCFS leaves idx = 0

  // 2) Dequeue
  const [job] = readyQueue.splice(idx, 1);
  isProcessing = true;

  // 3) Record start/end for Gantt & stats
  const startTime      = timer;
  const completionTime = startTime + job.burstTime;
  jobLog.push({
    id:             job.id,
    burstTime:      job.burstTime,
    arrivalTime:    job.arrivalTime,
    startTime,
    completionTime
  });

  // 4) Update Processing UI
  procListDOM.innerHTML = `<li>${job.id} (BT: ${job.burstTime})</li>`;
  refreshReadyQueueUI();

  // 5) Simulate the burst
  setTimeout(() => {
    // Move to Completed
    procListDOM.innerHTML = '';
    const doneLi = document.createElement('li');
    doneLi.textContent = `${job.id} ✅`;
    compListDOM.appendChild(doneLi);

    isProcessing = false;
    // Continue with next
    startProcessing();
  }, job.burstTime * 1000);
}

// ─── Refresh Ready Queue UI ───────────────────────────────
function refreshReadyQueueUI() {
  readyListDOM.innerHTML = '';
  let displayQueue = [...readyQueue];

  if (selectedAlgorithm === 'SJF') {
    displayQueue.sort((a, b) => a.burstTime - b.burstTime);
  } else if (selectedAlgorithm === 'Priority') {
    displayQueue.sort((a, b) => a.priority - b.priority);
  }
  // FCFS = as-is

  displayQueue.forEach(job => {
    const li = document.createElement('li');
    li.textContent = `${job.id} (BT: ${job.burstTime}, AT: ${job.arrivalTime})` +
                     (job.priority != null ? ` [P:${job.priority}]` : '');
    readyListDOM.appendChild(li);
  });
}

// ─── Stop & Render Gantt + Stats ─────────────────────────
stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  stopRequested = true;
  addJobBtn.disabled = true;
  stopBtn.disabled   = true;
  renderGanttAndStats();
});

function renderGanttAndStats() {
  const container = document.getElementById('ganttContainer');
  const tableBody = document.querySelector('#jobTable tbody');

  // reset
  container.innerHTML   = '';
  tableBody.innerHTML   = '';
  avgTurnDOM.textContent    = '–';
  avgWaitDOM.textContent    = '–';
  throughputDOM.textContent = '–';

  const totalTime = timer;
  const nJobs     = jobLog.length;
  let sumTurn    = 0;
  let sumWait    = 0;

  jobLog.forEach(job => {
    // — Gantt bar —
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
    // tooltip
    barDiv.title = `Start: ${job.startTime}s\nEnd: ${job.completionTime}s`;

    rowDiv.appendChild(labelDiv);
    rowDiv.appendChild(barDiv);
    container.appendChild(rowDiv);

    // — Stats table row —
    const tr           = document.createElement('tr');
    const turnaround   = job.completionTime - job.arrivalTime;
    const waiting      = turnaround - job.burstTime;
    sumTurn += turnaround;
    sumWait += waiting;

    [
      job.id,
      job.burstTime,
      job.arrivalTime,
      job.startTime,
      job.completionTime,
      turnaround,
      waiting
    ].forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  // — Summary metrics —
  if (nJobs > 0) {
    avgTurnDOM.textContent    = (sumTurn / nJobs).toFixed(2);
    avgWaitDOM.textContent    = (sumWait / nJobs).toFixed(2);
    throughputDOM.textContent = (nJobs / totalTime).toFixed(3);
  }

  document.querySelector('.gantt-section').style.display = 'block';
}
