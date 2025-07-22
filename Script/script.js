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
