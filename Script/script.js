// Script/script.js

console.log("CPU Scheduler Simulator Loaded");

let selectedAlgorithm = null;
let timer = 0;
let timerInterval = null;
let jobCounter = 1;
let processing = false;
let stopped = false;

const readyQueue = [];
const jobLog = [];

const elems = {
  algoSelect: document.getElementById('algorithmSelect'),
  startBtn: document.getElementById('startButton'),
  addBtn: document.getElementById('addJobButton'),
  stopBtn: document.getElementById('stopButton'),
  timerDisplay: document.getElementById('timer'),
  readyList: document.getElementById('readyList'),
  procList: document.getElementById('processingList'),
  compList: document.getElementById('completedList'),
  avgTurn: document.getElementById('avgTurnaround'),
  avgWait: document.getElementById('avgWaiting'),
  throughput: document.getElementById('throughput'),
  ganttSection: document.querySelector('.gantt-section'),
  ganttContainer: document.getElementById('ganttContainer'),
  statsBody: document.querySelector('#jobTable tbody')
};

elems.startBtn.addEventListener('click', () => {
  const algo = elems.algoSelect.value;
  if (!algo) return alert('Select an algorithm first!');
  selectedAlgorithm = algo;
  elems.algoSelect.disabled = true;
  elems.startBtn.disabled = true;
  document.querySelector('.job-section').style.display = 'flex';

  timerInterval = setInterval(() => {
    timer++;
    elems.timerDisplay.textContent = timer;
  }, 1000);
});

elems.addBtn.addEventListener('click', () => {
  const burst = parseInt(prompt(`Burst time for J${jobCounter}`), 10);
  if (!burst || burst <= 0) return alert('Enter a positive number');
  let priority = null;

  if (selectedAlgorithm === 'Priority') {
    const p = prompt(`Priority for J${jobCounter} (lower is higher)`);
    priority = isNaN(p) ? null : parseInt(p, 10);
    if (priority === null) return alert('Invalid priority');
  }

  const job = {
    id: `J${jobCounter++}`,
    burstTime: burst,
    arrivalTime: timer,
    priority
  };

  readyQueue.push(job);
  updateReadyList();
  processNext();
});

elems.stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  stopped = true;
  elems.addBtn.disabled = true;
  elems.stopBtn.disabled = true;
  renderResults();
});

function processNext() {
  if (processing || !readyQueue.length || stopped) return;

  // pick next index based on algo
  let idx = 0;
  if (selectedAlgorithm === 'SJF') {
    idx = readyQueue.findIndex(j => j.burstTime === Math.min(...readyQueue.map(x => x.burstTime)));
  }
  if (selectedAlgorithm === 'Priority') {
    idx = readyQueue.findIndex(j => j.priority === Math.min(...readyQueue.map(x => x.priority)));
  }

  const job = readyQueue.splice(idx, 1)[0];
  processing = true;

  const startTime = timer;
  const finishTime = startTime + job.burstTime;
  jobLog.push({ ...job, startTime, finishTime });

  elems.procList.innerHTML = `<li>${job.id} (BT:${job.burstTime})</li>`;
  updateReadyList();

  setTimeout(() => {
    elems.procList.innerHTML = '';
    const done = document.createElement('li');
    done.textContent = `${job.id} ✅`;
    elems.compList.appendChild(done);
    processing = false;
    processNext();
  }, job.burstTime * 1000);
}

function updateReadyList() {
  elems.readyList.innerHTML = '';
  let list = [...readyQueue];

  if (selectedAlgorithm === 'SJF') {
    list.sort((a, b) => a.burstTime - b.burstTime);
  }
  if (selectedAlgorithm === 'Priority') {
    list.sort((a, b) => a.priority - b.priority);
  }

  list.forEach(job => {
    const li = document.createElement('li');
    li.textContent = `${job.id} (BT:${job.burstTime}, AT:${job.arrivalTime})`
                   + (job.priority != null ? ` [P:${job.priority}]` : '');
    elems.readyList.appendChild(li);
  });
}

function renderResults() {
  elems.ganttContainer.innerHTML = '';
  elems.statsBody.innerHTML = '';
  elems.avgTurn.textContent = '–';
  elems.avgWait.textContent = '–';
  elems.throughput.textContent = '–';

  const totalTime = timer;
  const count = jobLog.length;
  let sumTurn = 0, sumWait = 0;

  jobLog.forEach(job => {
    // Gantt bar
    const row = document.createElement('div');
    row.className = 'gantt-row';

    const label = document.createElement('div');
    label.className = 'gantt-label';
    label.textContent = job.id;

    const bar = document.createElement('div');
    bar.className = 'gantt-bar';
    const w = ((job.finishTime - job.startTime) / totalTime) * 100;
    const o = (job.startTime / totalTime) * 100;
    bar.style.width = `${w}%`;
    bar.style.marginLeft = `${o}%`;
    bar.title = `Start: ${job.startTime}s\nEnd: ${job.finishTime}s`;

    row.append(label, bar);
    elems.ganttContainer.appendChild(row);

    // Stats table
    const tr = document.createElement('tr');
    const turnaround = job.finishTime - job.arrivalTime;
    const waiting = turnaround - job.burstTime;
    sumTurn += turnaround;
    sumWait += waiting;

    [job.id, job.burstTime, job.arrivalTime, job.startTime,
     job.finishTime, turnaround, waiting].forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      tr.appendChild(td);
    });
    elems.statsBody.appendChild(tr);
  });

  if (count) {
    elems.avgTurn.textContent = (sumTurn / count).toFixed(2);
    elems.avgWait.textContent = (sumWait / count).toFixed(2);
    elems.throughput.textContent = (count / timer).toFixed(3);
  }

  elems.ganttSection.style.display = 'block';
}
