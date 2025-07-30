// Script/script.js

console.log("CPU Scheduler Simulator Loaded");

let selectedAlgorithm = null;
let timer = 0;
let timerInterval = null;
let jobCounter = 1;
let processing = false;
let stopped = false;
let timeQuantum = null;

const readyQueue = [];
const jobLog = [];

// 1) Grab static elements
const elems = {
  algoSelect:     document.getElementById('algorithmSelect'),
  startBtn:       document.getElementById('startButton'),
  addBtn:         document.getElementById('addJobButton'),
  stopBtn:        document.getElementById('stopButton'),
  timerDisplay:   document.getElementById('timer'),
  readyList:      document.getElementById('readyList'),
  procList:       document.getElementById('processingList'),
  compList:       document.getElementById('completedList'),
  avgTurn:        document.getElementById('avgTurnaround'),
  avgWait:        document.getElementById('avgWaiting'),
  throughput:     document.getElementById('throughput'),
  ganttSection:   document.querySelector('.gantt-section'),
  ganttContainer: document.getElementById('ganttContainer'),
  statsBody:      document.querySelector('#jobTable tbody')
};

// 2) Dynamically insert the quantum input next to the select
(function insertQuantumInput() {
  const input = document.createElement('input');
  input.type = 'number';
  input.id = 'timeQuantumInput';
  input.placeholder = 'Quantum (s)';
  input.min = '1';
  input.style.display = 'none';
  input.style.width = '6em';
  input.style.marginLeft = '0.5em';
  elems.algoSelect.parentNode.insertBefore(input, elems.startBtn);
  elems.quantumInput = input;
})();

// 3) Show/hide quantum input when algorithm changes
elems.algoSelect.addEventListener('change', () => {
  selectedAlgorithm = elems.algoSelect.value;
  if (selectedAlgorithm === 'RR') {
    elems.quantumInput.style.display = 'inline-block';
  } else {
    elems.quantumInput.style.display = 'none';
    elems.quantumInput.value = '';
  }
});

elems.startBtn.addEventListener('click', () => {
  selectedAlgorithm = elems.algoSelect.value;
  if (!selectedAlgorithm) {
    return alert('Select an algorithm first!');
  }

  // For RR, grab the quantum
  if (selectedAlgorithm === 'RR') {
    const q = parseInt(elems.quantumInput.value, 10);
    if (!q || q <= 0) {
      return alert('Enter a positive Time Quantum for RR!');
    }
    timeQuantum = q;
  }

  // Disable controls
  elems.algoSelect.disabled = true;
  elems.quantumInput.disabled = true;
  elems.startBtn.disabled = true;
  document.querySelector('.job-section').style.display = 'flex';

  timerInterval = setInterval(() => {
    timer++;
    elems.timerDisplay.textContent = timer;
  }, 1000);
});

elems.addBtn.addEventListener('click', () => {
  const burst = parseInt(prompt(`Burst time for J${jobCounter}`), 10);
  if (!burst || burst <= 0) return alert('Enter a positive burst time');

  let priority = null;
  if (selectedAlgorithm === 'Priority') {
    const p = prompt(`Priority for J${jobCounter} (lower = higher)`);
    priority = isNaN(p) ? null : parseInt(p, 10);
    if (priority === null) return alert('Invalid priority');
  }

  // Store originalBurst for stats later
  const job = {
    id:            `J${jobCounter++}`,
    burstTime:     burst,
    originalBurst: burst,
    arrivalTime:   timer,
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

  // ── RR ────────────────────────────────────────────
  if (selectedAlgorithm === 'RR') {
    const job = readyQueue.shift();
    const exec = Math.min(timeQuantum, job.burstTime);
    const startTime = timer;
    const finishTime = startTime + exec;

    // Log each slice
    jobLog.push({ ...job, startTime, finishTime, isSlice: true });

    processing = true;
    elems.procList.innerHTML =
      `<li>${job.id} (BT:${job.burstTime} → ${job.burstTime - exec})</li>`;
    updateReadyList();

    setTimeout(() => {
      // clear processing display for *every* slice
      elems.procList.innerHTML = '';
      processing = false;

      job.burstTime -= exec;
      if (job.burstTime > 0) {
        readyQueue.push(job);
      } else {
        const done = document.createElement('li');
        done.textContent = `${job.id} ✅`;
        elems.compList.appendChild(done);
      }
      processNext();
    }, exec * 1000);

    return;
  }

  // ── FCFS / SJF / Priority ─────────────────────────
  let idx = 0;
  if (selectedAlgorithm === 'SJF') {
    idx = readyQueue.findIndex(j =>
      j.burstTime === Math.min(...readyQueue.map(x => x.burstTime))
    );
  }
  if (selectedAlgorithm === 'Priority') {
    idx = readyQueue.findIndex(j =>
      j.priority === Math.min(...readyQueue.map(x => x.priority))
    );
  }

  const job = readyQueue.splice(idx, 1)[0];
  const startTime = timer;
  const finishTime = startTime + job.burstTime;

  jobLog.push({ ...job, startTime, finishTime });
  processing = true;
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
    li.textContent =
      `${job.id} (BT:${job.burstTime}, AT:${job.arrivalTime})` +
      (job.priority != null ? ` [P:${job.priority}]` : '');
    elems.readyList.appendChild(li);
  });
}

function renderResults() {
  const stopTime = timer;

  // 1) Gantt: all slices up to stop
  const slices = jobLog.filter(job => job.finishTime <= stopTime);

  // 2) Build per‑job stats: firstStart = min startTime, lastFinish = max finishTime
  const stats = {};
  slices.forEach(({ id, arrivalTime, startTime, finishTime, originalBurst }) => {
    if (!stats[id]) {
      stats[id] = {
        arrivalTime,
        originalBurst,
        firstStart: startTime,
        lastFinish: finishTime
      };
    } else {
      stats[id].firstStart = Math.min(stats[id].firstStart, startTime);
      stats[id].lastFinish = Math.max(stats[id].lastFinish, finishTime);
    }
  });

  // 3) Only fully completed jobs
  const completed = Object.entries(stats)
    .filter(([, d]) => d.lastFinish <= stopTime)
    .map(([id, d]) => ({
      id,
      arrivalTime:    d.arrivalTime,
      startTime:      d.firstStart,
      completionTime: d.lastFinish,
      burstTime:      d.originalBurst
    }));

  // Clear
  elems.ganttContainer.innerHTML = '';
  elems.statsBody.innerHTML = '';
  elems.avgTurn.textContent = '–';
  elems.avgWait.textContent = '–';
  elems.throughput.textContent = '–';

  const totalTime = stopTime;
  let sumTurn = 0, sumWait = 0;

  // Render Gantt slices
  slices.forEach(job => {
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
  });

  // Render stats table
  completed.forEach(j => {
    const turnaround = j.completionTime - j.arrivalTime;
    const waiting    = turnaround - j.burstTime;
    sumTurn += turnaround;
    sumWait += waiting;

    const tr = document.createElement('tr');
    [ j.id,
      j.burstTime,
      j.arrivalTime,
      j.startTime,
      j.completionTime,
      turnaround,
      waiting
    ].forEach(v => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    elems.statsBody.appendChild(tr);
  });

  // Summary metrics
  const count = completed.length;
  if (count) {
    elems.avgTurn.textContent = (sumTurn / count).toFixed(2);
    elems.avgWait.textContent = (sumWait / count).toFixed(2);
    elems.throughput.textContent = (count / totalTime).toFixed(3);
  }

  elems.ganttSection.style.display = 'block';
}
