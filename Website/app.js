let processes = [];
let id = 1;

const noPriority = document.getElementById("noPriority");
const priorityInput = document.getElementById("priority");

noPriority.addEventListener("change", () => {
    if (noPriority.checked) {
        priorityInput.disabled = true;
        priorityInput.value = 0;
        processes.forEach(p => p.priority = 0);
    } else {
        priorityInput.disabled = false;
    }
    renderTable();
});

function addProcess() {
    let a = +arrival.value;
    let b = +burst.value;
    let p = noPriority.checked ? 0 : +priority.value;

    if (arrival.value === "" || burst.value === "" || (noPriority.checked ? false : priority.value === "") || isNaN(a) || isNaN(b) || isNaN(p)) {
        alert("Please fill all fields with valid numbers");
        return;
    }
    
    if (!Number.isInteger(a) || !Number.isInteger(b) || !Number.isInteger(p)) {
        alert("Please enter integer numbers only");
        return;
    }

    if (a < 0 || b <= 0 || p < 0) {
        console.log(a)
        alert("Invalid input");
        return;
    }

    processes.push({
        id: id++,
        arrival: a,
        burst: b,
        remaining: b,
        priority: p,
        start: -1,
        completion: 0,
        added: false
    });

    renderTable();
}

function renderTable() {
    table.innerHTML = "";

    processes.forEach(p => {
        table.innerHTML += `
        <tr>
            <td>P${p.id}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            ${noPriority.checked ? "" : `<td class="priority-col">${p.priority}</td>`}
        </tr>`;
    });
}



function roundRobin(proc, q) {
    let time = 0;
    let queue = [];
    let gantt = [];

    proc = JSON.parse(JSON.stringify(proc));

    let completed = 0;
    let n = proc.length;

    while (completed < n) {

        
        proc.forEach(p => {
            if (!p.added && p.arrival <= time) {
                queue.push(p);
                p.added = true;
            }
        });

        if (queue.length === 0) {
            time++;
            continue;
        }

        let cur = queue.shift();

        if (cur.start === -1) cur.start = time;

        let exec = Math.min(q, cur.remaining);

        gantt.push({
            id: cur.id,
            start: time,
            end: time + exec
        });

        time += exec;
        cur.remaining -= exec;

        
        proc.forEach(p => {
            if (!p.added && p.arrival <= time) {
                queue.push(p);
                p.added = true;
            }
        });

        if (cur.remaining > 0) {
            queue.push(cur);
        } else {
            cur.completion = time;
            completed++;
        }
    }

    return { proc, gantt };
}



function priorityScheduling(proc) {
    let time = 0;
    let completed = 0;
    let n = proc.length;
    let gantt = [];

    proc = JSON.parse(JSON.stringify(proc));

    let current = null;

    while (completed < n) {

        
        let ready = proc.filter(p =>
            p.arrival <= time && p.remaining > 0
        );

        if (ready.length === 0) {
            time++;
            continue;
        }

        
        ready.sort((a, b) => {
            if (a.priority === b.priority)
                return a.arrival - b.arrival;
            return a.priority - b.priority;
        });

        let next = ready[0];

        
        if (current !== next) {
            
            gantt.push({
                id: next.id,
                start: time,
                end: time + 1
            });
        } else {
            
            gantt[gantt.length - 1].end++;
        }

        if (next.start === -1) next.start = time;

        
        next.remaining--;
        time++;

        current = next;

        
        if (next.remaining === 0) {
            next.completion = time;
            completed++;
            current = null;
        }
    }

    return { proc, gantt };
}



function calc(proc) {
    let totalWT = 0, totalTAT = 0, totalRT = 0;

    let res = proc.map(p => {
        let tat = p.completion - p.arrival;
        let wt = tat - p.burst;
        let rt = (p.start === -1 ? 0 : p.start - p.arrival);

        totalWT += wt;
        totalTAT += tat;
        totalRT += rt;

        return { ...p, tat, wt, rt };
    });

    return {
        data: res,
        avgWT: (totalWT / proc.length).toFixed(2),
        avgTAT: (totalTAT / proc.length).toFixed(2),
        avgRT: (totalRT / proc.length).toFixed(2)
    };
}



function drawGantt(gantt, element) {
    element.innerHTML = "";

    if (!gantt.length) {
        element.innerHTML = "No Data";
        return;
    }

    const scale = 40;
    const offset = 80;

    let wrapper = document.createElement("div");
    wrapper.className = "gantt-wrapper";
    wrapper.style.position = "relative";

    let grid = document.createElement("div");
    grid.className = "gantt-grid";
    grid.style.position = "relative";

    let timeline = document.createElement("div");
    timeline.className = "timeline";
    timeline.style.position = "relative";

    let colors = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#14b8a6", "#a855f7"];

    let rows = {};

    gantt.forEach(b => {
        if (!rows[b.id]) rows[b.id] = [];
        rows[b.id].push(b);
    });

    let maxTime = Math.max(...gantt.map(g => g.end));

    Object.keys(rows).forEach(pid => {

        let row = document.createElement("div");
        row.className = "gantt-row";
        row.style.position = "relative";

        let label = document.createElement("div");
        label.className = "gantt-label";
        label.innerText = "P" + pid;

        row.appendChild(label);

        rows[pid].forEach(b => {
            let bar = document.createElement("div");
            bar.className = "gantt-bar";

            bar.style.position = "absolute";

            
            bar.style.left = (offset) + (b.start * scale) + "px";
            bar.style.width = (b.end - b.start) * scale + "px";
            bar.style.background = colors[(pid - 1) % colors.length];

            bar.innerText = `${b.start}-${b.end}`;

            row.appendChild(bar);
        });

        grid.appendChild(row);
    });

    
    for (let i = 0; i <= maxTime; i++) {
        let t = document.createElement("div");
        t.innerText = i;
        t.style.left = offset + (i * scale) + "px";
        timeline.appendChild(t);
    }

    wrapper.appendChild(timeline);
    wrapper.appendChild(grid);
    element.appendChild(wrapper);
}

function generateAnalysis(rr, pr) {
    let focus = "";
    let conclusion = "";

    focus += `<ul>`;

    
    focus += `<li><b>Fairness vs Urgency</b><br>
              <u>Question:</u> Which algorithm is more fair, and which focuses on urgency?<br>
              <b>Round Robin:</b> Highly fair, gives equal time slices to all processes.<br>
              <b>Priority Scheduling:</b> Focuses on urgency, higher priority processes run first.
              </li>`;

            
    focus += `<li><b>Execution Order</b><br>
              <u>Question:</u> How is execution order determined?<br>
              <b>Round Robin:</b> Cyclic order, each process executed in turn.<br>
              <b>Priority Scheduling:</b> Based on priority values, higher priority executes first.
              </li>`;

            
    focus += `<li><b>Urgent Process Advantage</b><br>
              <u>Question:</u> Which algorithm benefits urgent processes more?<br>
              <b>Round Robin:</b> No special advantage for urgent processes.<br>
              <b>Priority Scheduling:</b> Gives advantage to urgent/high-priority processes.
              </li>`;

            
    focus += `<li><b>Starvation Risk</b><br>
              <u>Question:</u> Is starvation possible?<br>
              <b>Round Robin:</b> No starvation, all processes get CPU time.<br>
              <b>Priority Scheduling:</b> Starvation may occur for low-priority processes.
              </li>`;

            
    focus += `<li><b>CPU Time Distribution</b><br>
              <u>Question:</u> How is CPU time shared?<br>
              <b>Round Robin:</b> Evenly distributed among all processes.<br>
              <b>Priority Scheduling:</b> Uneven distribution based on priority.
              </li>`;

    focus += `</ul>`;

    
    conclusion += `<ul>`;

    

    if (rr.avgWT < pr.avgWT && rr.avgTAT < pr.avgTAT && rr.avgRT < pr.avgRT) {
        conclusion += `<li><b>Overall Performance</b><br>
                   <u>Result:</u> Round Robin performed better on the selected dataset (process table).<br>
                   It achieved lower waiting time, turnaround time, and response time overall.
                   </li>`;
    }
    else if (pr.avgWT < rr.avgWT && pr.avgTAT < rr.avgTAT && pr.avgRT < rr.avgRT) {
        conclusion += `<li><b>Overall Performance</b><br>
                   <u>Result:</u> Priority Scheduling performed better on the selected dataset (process table).<br>
                   It achieved lower average execution metrics overall.
                   </li>`;
    }
    else {
        conclusion += `<li><b>Overall Performance</b><br>
                   <u>Result:</u> Performance is mixed depending on metrics.<br>
                   Round Robin performs better in fairness, while Priority Scheduling performs better in urgency.
                   </li>`;
    }

    
    conclusion += `<li><b>Fairness vs Urgency</b><br>
                   <u>Question:</u> Which one prioritizes fairness or urgency?<br>
                   <b>Round Robin:</b> Ensures fairness by equal CPU distribution.<br>
                   <b>Priority Scheduling:</b> Ensures urgency by prioritizing important processes.
                   </li>`;



    function getMaxWT(data) {
        if (!data || data.length === 0) return 0;

        let max = 0;
        data.forEach(p => {
            if (p.wt > max) max = p.wt;
        });
        return max;
    }
    
    let rrMaxWT = getMaxWT(rr.data);
    let prMaxWT = getMaxWT(pr.data);

    
    if (pr.avgWT > 0 && prMaxWT > pr.avgWT * 1.5) {
        conclusion += `<li><b>Starvation</b><br>
                   <u>Result:</u> Starvation risk appeared in Priority Scheduling based on the process table (some processes waited significantly longer than average).
                   </li>`;
    } else {
        conclusion += `<li><b>Starvation</b><br>
                   <u>Result:</u> No starvation risk detected in Priority Scheduling based on the process table.
                   </li>`;
    }

    
    if (rr.avgWT > 0 && rrMaxWT > rr.avgWT * 1.5) {
        conclusion += `<li>Round Robin shows some imbalance, but no starvation.</li>`;
    } else {
        conclusion += `<li>Round Robin remains fair with no starvation.</li>`;
    }

    conclusion += `</ul>`;
    document.getElementById("comparisonFocus").innerHTML = focus;
    document.getElementById("conclusion").innerHTML = conclusion;
}



function drawTable(res, el) {
    let html = `<table>
  <tr><th>P</th><th>WT</th><th>TAT</th><th>RT</th></tr>`;

    res.data.forEach(p => {
        html += `<tr>
      <td>P${p.id}</td>
      <td>${p.wt}</td>
      <td>${p.tat}</td>
      <td>${p.rt}</td>
    </tr>`;
    });

    html += `</table>
  <p>Avg WT: ${res.avgWT}</p>
  <p>Avg TAT: ${res.avgTAT}</p>
  <p>Avg RT: ${res.avgRT}</p>`;

    el.innerHTML = html;
}



function compare(rr, pr) {
    comparison.innerHTML = `
    <table class="comparison-table">
        <thead>
            <tr>
                <th>Criteria</th>
                <th>Round Robin</th>
                <th>Priority Scheduling</th>
                <th>Better</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Average Waiting Time</td>
                <td>${rr.avgWT}</td>
                <td>${pr.avgWT}</td>
                <td>${rr.avgWT < pr.avgWT ? "Round Robin" : "Priority Scheduling"}</td>
            </tr>
            <tr>
                <td>Average Response Time</td>
                <td>${rr.avgRT}</td>
                <td>${pr.avgRT}</td>
                <td>${rr.avgRT < pr.avgRT ? "Round Robin" : "Priority Scheduling"}</td>
            </tr>
            <tr>
                <td>Fairness</td>
                <td>High</td>
                <td>Medium</td>
                <td>Round Robin</td>
            </tr>
            <tr>
                <td>Starvation Risk</td>
                <td>Low</td>
                <td>High</td>
                <td>Round Robin</td>
            </tr>
            <tr>
                <td>Better Waiting Time</td>
                <td colspan="2">${rr.avgWT < pr.avgWT ? "Round Robin" : "Priority Scheduling"}</td>
            </tr>
            <tr>
                <td>Better Response Time</td>
                <td colspan="2">${rr.avgRT < pr.avgRT ? "Round Robin" : "Priority Scheduling"}</td>
            </tr>
        </tbody>
    </table>
  `;
}



function run() {
    if (processes.length === 0) {
        alert("Please add processes!");
        return;
    }
    
    let q = +quantum.value;

    let rrRes = null;
    let rr = null;

    

    if (!isNaN(q) && q > 0) {
        rr = roundRobin(processes, q);
        rrRes = calc(rr.proc);

        drawGantt(rr.gantt, document.getElementById("rrGantt"));
        drawTable(rrRes, rrTable);
    } else {
        document.getElementById("rrGantt").innerHTML = "Time quantum is not valid";
        rrTable.innerHTML = "";
        rrRes = null;
    }

    

    let prRes = null;

    if (!noPriority.checked) {
        let pr = priorityScheduling(processes);
        prRes = calc(pr.proc);

        drawGantt(pr.gantt, document.getElementById("prGantt"));
        drawTable(prRes, prTable);

        document.getElementById("prioritySection").style.display = "block";
    } else {
        document.getElementById("prGantt").innerHTML = "";
        prTable.innerHTML = "";
        document.getElementById("prioritySection").style.display = "none";
    }

    

    if (rrRes && prRes) {
        compare(rrRes, prRes);
        generateAnalysis(rrRes, prRes);
    }
    else if (rrRes && !prRes) {
        comparison.innerHTML = `<p>Only Round Robin executed (no priority mode selected).</p>`;
        generateAnalysis(rrRes, { data: [] });
    }
    else if (!rrRes && prRes) {
        comparison.innerHTML = `<p>Only Priority Scheduling executed (no quantum provided).</p>`;
        generateAnalysis({ data: [] }, prRes);
    }
    else {
        comparison.innerHTML = `<p>No scheduling executed.</p>`;
    }
}



function resetProcesses() {
    processes = [];
    id = 1;
    renderTable();
}

function resetInputs() {
    document.getElementById("arrival").value = "";
    document.getElementById("burst").value = "";
    document.getElementById("priority").value = "";
    document.getElementById("quantum").value = "";
    document.getElementById("noPriority").checked = false;
    document.getElementById("priority").disabled = false;
}

function resetTable() {
    resetProcesses();
    document.getElementById("rrGantt").innerHTML = "";
    document.getElementById("rrTable").innerHTML = "";
    document.getElementById("prGantt").innerHTML = "";
    document.getElementById("prTable").innerHTML = "";
    document.getElementById("comparison").innerHTML = "";
    document.getElementById("comparisonFocus").innerHTML = "";
    document.getElementById("conclusion").innerHTML = "";
}

function loadScenario(type) {

    resetProcesses();

    noPriority.checked = false;
    priorityInput.disabled = false;

    let scenario = {};
    let quantumValue = 2;

    switch(type) {

        case 'A':
            scenario = [
                {arrival:0, burst:5, priority:2},
                {arrival:1, burst:3, priority:1},
                {arrival:2, burst:8, priority:3},
                {arrival:3, burst:6, priority:2}
            ];
            quantumValue = 3;
            break;

        case 'B':
            scenario = [
                {arrival:0, burst:10, priority:5},
                {arrival:1, burst:2, priority:1},
                {arrival:2, burst:1, priority:1}
            ];
            quantumValue = 3;
            break;

        case 'C':
            scenario = [
                {arrival:0, burst:6, priority:2},
                {arrival:0, burst:6, priority:2},
                {arrival:0, burst:6, priority:2}
            ];
            quantumValue = 2;
            break;

        case 'D':
            scenario = [
                {arrival:0, burst:20, priority:5},
                {arrival:1, burst:2, priority:1},
                {arrival:2, burst:2, priority:1},
                {arrival:3, burst:2, priority:1},
                {arrival:4, burst:2, priority:1}
            ];
            quantumValue = 2;
            break;

        case 'E':

            alert(
                "Invalid Input Scenario Loaded\n\n" +
                "Examples:\n" +
                "- Quantum <= 0\n" +
                "- Negative Priority\n" +
                "- Negative Burst Time"
            );

            quantum.value = 0;

            arrival.value = "";
            burst.value = -5;
            priority.value = -3;

            return;
    }

    scenario.forEach(p => {

        processes.push({
            id: id++,
            arrival: p.arrival,
            burst: p.burst,
            remaining: p.burst,
            priority: p.priority,
            start: -1,
            completion: 0,
            added: false
        });

    });

    quantum.value = quantumValue;

    renderTable();

    run();
}
