const POST_URL = '/';

const getParams = __PARSE_URL_VARS__();
let tokens = (getParams.tokens || '').split(',');
document.body.classList = tokens.join(' ');
let changesMade = false;

const hasToken = name => tokens.indexOf(name) !== -1;
const hasPower = () => powerWarning.classList.contains('resolved');

const handleBtn = event => {
  if (!hasPower()) {
    return playErr();
  }
  const targetFloor = event.currentTarget.attributes['data-floor'].value;
  $.ajax({
    type: 'POST',
    url: POST_URL,
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify({ 
      targetFloor,
      id: getParams.id,
    }),
    success: (res, status) => {
      if (res.hash) {
        __POST_RESULTS__({
          resourceId: getParams.id || '1111',
          hash: res.hash,
          action: `goToFloor-${targetFloor}`,
        });
        closeChallenge();
      }
    }
  });
}

const playErr = () => {
  __SEND_MSG__({
    type: 'sfx',
    filename: 'error.mp3',
  });
}

const closeChallenge = () => {
  __SEND_MSG__({
    type: 'exit',
  });
}

const btn1 = document.querySelector('button[data-floor="1"]');
const btn2 = document.querySelector('button[data-floor="2"]');
const btn3 = document.querySelector('button[data-floor="3"]');
const btn4 = document.querySelector('button[data-floor="4"]');
const btn5 = document.querySelector('button[data-floor="5"]');

const cover = document.querySelector('.cover');
const coverOpen = document.querySelector('.coveropen');
const coverClose = document.querySelector('.coverclose');
const powerWarning = document.querySelector('.power-warning');
const powerWarningInside = document.querySelector('.power-warning-inside');

coverOpen.addEventListener('click', () => {
    cover.classList.add('open');
});

coverClose.addEventListener('click', () => {
  cover.classList.remove('open');
});

btn1.addEventListener('click', handleBtn);
btn2.addEventListener('click', handleBtn);
// btn3.addEventListener('click', handleBtn);
btn4.addEventListener('click', handleBtn);
// btn5.addEventListener('click', handleBtn);
// btn6.addEventListener('click', handleBtn);

const decoration = {
  'towerlobby': btn1,
  'frosttalkslobby': btn2,
  'frostu': btn3,
  'jacksoffice': btn4,
  'rooftop': btn5,
  // 'netwars': btn6,
};

decoration[(getParams.area || 'towerlobby')].classList.add('active');

/// circuit stuff

try {
  localStorage.getItem('test');
} catch (err) {
  // lsErrorMsg.style.display = 'block';
}

const getLS = key => {
  try {
    return localStorage.getItem(key);
  } catch (err) {}
}

const setLS = (key, val) => {
  try {
    localStorage.setItem(key, val);
  } catch (err) {}
}

const clearLS = (key, val) => {
  try {
    localStorage.clear();
  } catch (err) {}
}

const collide = (el1, el2) => {
  let rect1 = el1.getBoundingClientRect();
  let rect2 = el2.getBoundingClientRect();

  return !(
    rect1.top > rect2.bottom ||
    rect1.right < rect2.left ||
    rect1.bottom < rect2.top ||
    rect1.left > rect2.right
  );
};

let tmpICPlacement, icDragging;

function placeIC(icElement, targetElement) {
  const brect = targetElement.getBoundingClientRect();
  icElement.style.top = `${brect.top + 8}px`;
  icElement.style.left = `${brect.left + 7}px`;
}

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }
  
  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
    icDragging = icsArray.indexOf(elmnt);
    tmpICPlacement = icPlacement.indexOf(icDragging);
  }
  
  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    const dropTarget = slotsArray.filter(slot => collide(elmnt, slot));
    if (dropTarget.length && elmnt.attributes['data-gate']) {
      const toReplace = icPlacement[slotsArray.indexOf(dropTarget[0])];
      icPlacement[slotsArray.indexOf(dropTarget[0])] = icDragging;
      icPlacement[tmpICPlacement] = toReplace;
      changesMade = true;
    }
    placeICs();
    gateCheck(input1, getPlacedICs());
    setLS('frostavatorData', JSON.stringify(icPlacement));
  }
}

const getElementIndex = element => parseInt(element.innerText, 10) - 1;
const getElementGate = element => element.attributes['data-gate'].value;

const func = {
  and:  (a, b) => a && b,       // and
  nand: (a, b) => !(a && b),    // nand
  or:   (a, b) => a || b,       // or
  nor:  (a, b) => !(a || b),    // nor
  xor:  (a, b) => a ^ b,        // xor
  xnor: (a, b) => !(a ^ b),     // xnor
};

const gateByIndex = index => Object.keys(func)[index];

const getPlacedICs = () => icPlacement.map(ic => gateByIndex(ic));

const ics = document.querySelectorAll('.ic');
const slots = document.querySelectorAll('.slot');
const leds = document.querySelectorAll('.led');
const icsArray = [ ...ics ];
const slotsArray = [ ...slots ];

const elevatorLS = getLS('frostavatorData') || {};
let icPlacement = [ 4, 3, 5, 0, 1, 2 ];

if (elevatorLS) {
  try {
    icPlacement = JSON.parse(elevatorLS);
  } catch(err) {
    clearLS();
  }
}
// const icPlacement = getLS('frostavatorData') || [ 4, 3, 5, 0, 1, 2 ];

const placeICs = () => {
  icPlacement.forEach((icIndex, slotIndex) => placeIC(icsArray[icIndex], slotsArray[slotIndex]));
};

placeICs();

ics.forEach(ic => {
  dragElement(ic);
});

const clearLEDs = () => {
  document.querySelector('.input1').classList.remove('on');
  document.querySelector('.input2').classList.remove('on');
  document.querySelector('.input3').classList.remove('on');
  document.querySelector('.input4').classList.remove('on');

  document.querySelector('.output1').classList.remove('on');
  document.querySelector('.output2').classList.remove('on');
  document.querySelector('.output3').classList.remove('on');

  document.querySelector('.input1-1').classList.remove('on');
  document.querySelector('.input1-2').classList.remove('on');
  document.querySelector('.input1-3').classList.remove('on');
  document.querySelector('.input1-4').classList.remove('on');
  document.querySelector('.input1-5').classList.remove('on');
  document.querySelector('.input1-6').classList.remove('on');

  document.querySelector('.input2-1').classList.remove('on');
  document.querySelector('.input2-2').classList.remove('on');
  document.querySelector('.input2-3').classList.remove('on');
  document.querySelector('.input2-4').classList.remove('on');
  document.querySelector('.input2-5').classList.remove('on');
  document.querySelector('.input2-6').classList.remove('on');

  document.querySelector('.output2-1').classList.remove('on');
  document.querySelector('.output2-2').classList.remove('on');
  document.querySelector('.output2-3').classList.remove('on');
};

const setLEDs = (input, input1, input2, output1, output2) => {
  if (input[0]) document.querySelector('.input1').classList.add('on');
  if (input[1]) document.querySelector('.input2').classList.add('on');
  if (input[2]) document.querySelector('.input3').classList.add('on');
  if (input[3]) document.querySelector('.input4').classList.add('on');

  if (output1[0]) document.querySelector('.output1').classList.add('on');
  if (output1[1]) document.querySelector('.output2').classList.add('on');
  if (output1[2]) document.querySelector('.output3').classList.add('on');

  if (input1[0]) document.querySelector('.input1-1').classList.add('on');
  if (input1[1]) document.querySelector('.input1-2').classList.add('on');
  if (input1[2]) document.querySelector('.input1-3').classList.add('on');
  if (input1[3]) document.querySelector('.input1-4').classList.add('on');
  if (input1[4]) document.querySelector('.input1-5').classList.add('on');
  if (input1[5]) document.querySelector('.input1-6').classList.add('on');

  if (input2[0]) document.querySelector('.input2-1').classList.add('on');
  if (input2[1]) document.querySelector('.input2-2').classList.add('on');
  if (input2[2]) document.querySelector('.input2-3').classList.add('on');
  if (input2[3]) document.querySelector('.input2-4').classList.add('on');
  if (input2[4]) document.querySelector('.input2-5').classList.add('on');
  if (input2[5]) document.querySelector('.input2-6').classList.add('on');

  if (output2[0]) document.querySelector('.output2-1').classList.add('on');
  if (output2[1]) document.querySelector('.output2-2').classList.add('on');
  if (output2[2]) document.querySelector('.output2-3').classList.add('on');
};

const input1 = [ 0, 1, 0, 1 ];

const setInput1 = input => ([
  input[0],
  input[1],
  input[1],
  input[2],
  input[2],
  input[3],
]);

const setInput2 = input => ([
  input[0],
  input[1],
  input[0],
  input[2],
  input[1],
  input[2],
]);

const setOutput1 = (input1, ic1, ic2, ic3) => ([
  ic1 ? !!func[ic1](input1[0], input1[1]) : null,
  ic2 ? !!func[ic2](input1[2], input1[3]) : null,
  ic3 ? !!func[ic3](input1[4], input1[5]) : null,
]);

const setOutput2 = (input2, ic1, ic2, ic3, ic4, ic5, ic6) => ([
  ic1 && ic2 && ic4 ? !!func[ic4](input2[0], input2[1]) : null,
  ic1 && ic3 && ic5 ? !!func[ic5](input2[2], input2[3]) : null,
  ic2 && ic3 && ic6 ? !!func[ic6](input2[3], input2[4]) : null,
]);

const gateCheck = (input, config) => {
  const input1 = setInput1(input);
  const output1 = setOutput1(input1, config[0], config[1], config[2]);
  const input2 = setInput2(output1);
  const output2 = setOutput2(input2, config[0], config[1], config[2], config[3], config[4], config[5]);
  clearLEDs();
  setLEDs(input, input1, input2, output1, output2);
  if (output2.join(',') === 'true,true,true') {
    document.querySelector('.glow').classList.add('on');
    powerWarning.classList.add('resolved');
    powerWarningInside.classList.add('resolved');
    document.querySelector('.power-warning span').innerText = 'Online!';
    document.querySelector('.power-warning-inside span').innerText = 'Online!';
    if (changesMade) {
      $.ajax({
        type: 'POST',
        url: '/check',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({ 
          id: getParams.id,
          config: icPlacement,
        }),
        success: (res, status) => {
          mp3.play();
          if (res.hash) {
            __POST_RESULTS__({
              resourceId: getParams.id || '1111',
              hash: res.hash,
              action: `gatecheckchamp`,
            });
          }
        }
      });
    }
  } else {
    document.querySelector('.glow').classList.remove('on');
    powerWarning.classList.remove('resolved');
    powerWarningInside.classList.remove('resolved');
    document.querySelector('.power-warning span').innerText = 'No Power!';
    document.querySelector('.power-warning-inside span').innerText = 'No Power!';
  }
};

gateCheck(input1, getPlacedICs());

const mp3 = document.querySelector('audio');
