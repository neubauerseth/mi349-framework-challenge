// Better coordinate math: compute positions relative to the game field so the
// visible ball lines up with the SVG animated circle and lands in the net.
// compute half the ball width dynamically (safer than a hardcoded offset)
function halfBall() { return Math.round((ball && ball.offsetWidth) ? ball.offsetWidth / 2 : 20); }
const gameField = document.getElementById('game_field');
const goal = document.getElementById('goal');
const ball = document.getElementById('ball');
const svg = document.getElementById('svg');
const path = document.getElementById('path');
const circle = document.getElementById('circle');
const bally = document.getElementById('bally');

// remember original ball location so we can restore it after animation
const ballOriginalParent = ball ? ball.parentElement : null;
const ballOriginalNext = ball ? ball.nextSibling : null;

function updateViewBox() {
    const gf = gameField.getBoundingClientRect();
    // set viewBox to the field's internal coordinate space (0..width, 0..height)
    svg.setAttribute('viewBox', `0 0 ${Math.round(gf.width)} ${Math.round(gf.height)}`);
    svg.setAttribute('width', gf.width);
    svg.setAttribute('height', gf.height);
}

// safe helper to get the latest rects
function rects() {
    const gf = gameField.getBoundingClientRect();
    const b = ball.getBoundingClientRect();
    return { gf, b };
}

// click handler that starts the ball animation and follows the SVG circle
function grabClick(e) {
    // update metrics (in case layout changed)
    const { gf } = rects();
    updateViewBox();

    // If the ball is currently inline (not inside the field), move it into the field
    // so absolute positioning will work relative to the field.
    if (!gameField.contains(ball)) {
        // capture current visual rect so we can keep it from jumping
        const inlineRect = ball.getBoundingClientRect();
        gameField.appendChild(ball);
        ball.classList.add('in-field');
        // position the ball where it visually was (convert to field coords)
        const half = halfBall();
        const left0 = Math.round(inlineRect.left - gf.left - half);
        const top0 = Math.round(inlineRect.top - gf.top - half);
        ball.style.left = left0 + 'px';
        ball.style.top = top0 + 'px';
    }

    // add kicked state for CSS animation
    ball.classList.add('kicked');

    // poll the SVG circle's screen position and move the visible ball there
    const kick = setInterval(function () {
        const c = circle.getBoundingClientRect();
        // position the ball relative to the game field so it visually matches the SVG
        const half = halfBall();
        const left = Math.round(c.left - gf.left - half);
        const top = Math.round(c.top - gf.top - half);
        ball.style.left = left + 'px';
        ball.style.top = top + 'px';
    }, 1000 / 30);

    // stop after the animateMotion duration (1s) and show fall/goal states
    setTimeout(function () {
        clearInterval(kick);
        // final position check (optional scoring logic if you have hitboxes)
        const c = circle.getBoundingClientRect();
        const half = halfBall();
        const left = Math.round(c.left - gf.left - half);
        const top = Math.round(c.top - gf.top - half);
        // place the ball exactly where the SVG ended
        ball.style.left = left + 'px';
        ball.style.top = top + 'px';

        // example: show a fall state by default
        ball.classList.remove('kicked');
        ball.classList.add('fall');

        // reset visuals after a delay and restore original DOM location
        setTimeout(function () {
            // clear inline positioning
            ball.style.left = '';
            ball.style.top = '';
            ball.classList.remove('fall');

            // move ball back to original spot in the DOM
            if (ballOriginalParent) {
                if (ballOriginalNext) ballOriginalParent.insertBefore(ball, ballOriginalNext);

                else ballOriginalParent.appendChild(ball);
            }

            ball.classList.remove('in-field');
        }, 2000);

    }, 1000); // matches animateMotion dur
}

goal.addEventListener('click', grabClick);

// mousemove updates the path used by animateMotion (lets user curve shot)
goal.addEventListener('mousemove', function (e) {
    const { gf, b } = rects();

    // mouse coords relative to the field
    const x = e.clientX - gf.left;
    const y = e.clientY - gf.top;

    // start coordinates inside SVG coordinate space (ball center)
    const startX = (b.left - gf.left) + (b.width / 2);
    const startY = (b.top - gf.top) + (b.height / 2);
    const cpX = gf.width * 0.5; // control point X in SVG coords
    const cpY1 = gf.height * 0.6;
    const cpY2 = gf.height * 0.4;

    const d = `M ${startX} ${startY} C ${cpX} ${cpY1}, ${cpX} ${cpY2}, ${x} ${y}`;

    path.setAttribute('d', d);

    if (bally) bally.setAttribute('path', d);
});

// update viewBox on load and resize
window.addEventListener('load', updateViewBox);
window.addEventListener('resize', updateViewBox);