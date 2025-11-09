
// This was copied from https://www.codetap.org/project/goal-game
// Made adjustments to fit my project

// get half the ball's width (for centering)
function halfBall() { return Math.round((ball && ball.offsetWidth) ? ball.offsetWidth / 2 : 20); }
const gameField = document.getElementById('game_field');
const goal = document.getElementById('goal');
const ball = document.getElementById('ball');
const svg = document.getElementById('svg');
const path = document.getElementById('path');
const circle = document.getElementById('circle');
const bally = document.getElementById('bally');

// original ball location for reset
const ballOriginalParent = ball ? ball.parentElement : null;
const ballOriginalNext = ball ? ball.nextSibling : null;

function updateViewBox() {
    const gf = gameField.getBoundingClientRect();

    // set viewBox to the field's internal coordinate space
    svg.setAttribute('viewBox', `0 0 ${Math.round(gf.width)} ${Math.round(gf.height)}`);
    svg.setAttribute('width', gf.width);
    svg.setAttribute('height', gf.height);
}

// Helper to get the latest rects
function rects() {
    const gf = gameField.getBoundingClientRect();
    const b = ball.getBoundingClientRect();
    return { gf, b };
}

// handle click to kick the ball
function grabClick(e) {

    const { gf } = rects();
    updateViewBox();

    // move ball into field if not already there
    if (!gameField.contains(ball)) {
        
        const inlineRect = ball.getBoundingClientRect();
        gameField.appendChild(ball);
        ball.classList.add('in-field');

        
        const half = halfBall();
        const left0 = Math.round(inlineRect.left - gf.left - half);
        const top0 = Math.round(inlineRect.top - gf.top - half);
        ball.style.left = left0 + 'px';
        ball.style.top = top0 + 'px';
    }

    // add kicked class to start animation
    ball.classList.add('kicked');

    // update ball position along the path during the animation
    const kick = setInterval(function () {
        const c = circle.getBoundingClientRect();
        
        const half = halfBall();
        const left = Math.round(c.left - gf.left - half);
        const top = Math.round(c.top - gf.top - half);
        ball.style.left = left + 'px';
        ball.style.top = top + 'px';
    }, 1000 / 30);

    // after animation ends
    setTimeout(function () {
        clearInterval(kick);

        // reposition ball at end of path
        const c = circle.getBoundingClientRect();
        const half = halfBall();
        const left = Math.round(c.left - gf.left - half);
        const top = Math.round(c.top - gf.top - half);

        ball.style.left = left + 'px';
        ball.style.top = top + 'px';

        ball.classList.remove('kicked');
        ball.classList.add('fall');

        // reset visuals 
        setTimeout(function () {
            // clear inline positioning
            ball.style.left = '';
            ball.style.top = '';
            ball.classList.remove('fall');

            // move ball back to original spot
            if (ballOriginalParent) {
                if (ballOriginalNext) ballOriginalParent.insertBefore(ball, ballOriginalNext);

                else ballOriginalParent.appendChild(ball);
            }

            ball.classList.remove('in-field');
        }, 2000);

    }, 1000);
}

// attach event listeners
goal.addEventListener('click', grabClick);

// mousemove updates the path of ball
goal.addEventListener('mousemove', function (e) {
    const { gf, b } = rects();

    // mouse coordinates relative to the field
    const x = e.clientX - gf.left;
    const y = e.clientY - gf.top;

    // start coordinates inside SVG coordinate space (ball center)
    const startX = (b.left - gf.left) + (b.width / 2);
    const startY = (b.top - gf.top) + (b.height / 2);

    // control points for cubic Bezier curve
    const cpX = gf.width * 0.5;
    const cpY1 = gf.height * 0.6;
    const cpY2 = gf.height * 0.4;

    const d = `M ${startX} ${startY} C ${cpX} ${cpY1}, ${cpX} ${cpY2}, ${x} ${y}`;

    path.setAttribute('d', d);

    if (bally) bally.setAttribute('path', d);
});

// update viewBox on load and resize
window.addEventListener('load', updateViewBox);
window.addEventListener('resize', updateViewBox);