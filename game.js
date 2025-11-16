const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreDisplay = document.getElementById('finalScore');
const bestScoreDisplay = document.getElementById('bestScore');

// Cargar imagen de la cabeza
const headImage = new Image();
headImage.src = 'CabezaNicolas.png';

// Configuración del canvas
canvas.width = 400;
canvas.height = 600;

// Variables del juego
let bird = {
    x: 80,
    y: 250,
    width: 35,
    height: 35,
    velocity: 0,
    gravity: 0.5,
    jump: -9
};

let pipes = [];
let monsters = [];
let bullets = [];
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameRunning = false;
let frameCount = 0;

const PIPE_WIDTH = 60;
const PIPE_GAP = 180;
const PIPE_SPEED = 2;
const MONSTER_SPEED = 1.5;
const BULLET_SPEED = 8;

// Colores
const BIRD_COLOR = '#ffd700';
const PIPE_COLOR = '#2ecc71';
const PIPE_BORDER = '#27ae60';
const MONSTER_COLOR = '#e74c3c';
const BULLET_COLOR = '#f39c12';

// Inicializar el juego
function init() {
    bird.y = 250;
    bird.velocity = 0;
    pipes = [];
    monsters = [];
    bullets = [];
    score = 0;
    frameCount = 0;
    scoreDisplay.textContent = score;
    bestScoreDisplay.textContent = bestScore;
}

// Dibujar el pájaro
function drawBird() {
    ctx.save();
    ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
    
    // Rotar la cabeza según la velocidad
    let rotation = Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5);
    ctx.rotate(rotation);
    
    // Dibujar la imagen de la cabeza
    ctx.drawImage(headImage, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
    
    ctx.restore();
}

// Dibujar tubería
function drawPipe(pipe) {
    // Tubería superior
    ctx.fillStyle = PIPE_COLOR;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    ctx.strokeStyle = PIPE_BORDER;
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
    
    // Borde superior de la tubería
    ctx.fillStyle = PIPE_BORDER;
    ctx.fillRect(pipe.x - 5, pipe.top - 30, PIPE_WIDTH + 10, 30);
    ctx.strokeRect(pipe.x - 5, pipe.top - 30, PIPE_WIDTH + 10, 30);
    
    // Tubería inferior
    ctx.fillStyle = PIPE_COLOR;
    ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom);
    ctx.strokeRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom);
    
    // Borde inferior de la tubería
    ctx.fillStyle = PIPE_BORDER;
    ctx.fillRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 30);
    ctx.strokeRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 30);
}

// Crear nueva tubería
function createPipe() {
    const minTop = 100;
    const maxTop = canvas.height - PIPE_GAP - 100;
    const top = Math.random() * (maxTop - minTop) + minTop;
    
    pipes.push({
        x: canvas.width,
        top: top,
        bottom: top + PIPE_GAP,
        scored: false
    });
}

// Crear monstruo
function createMonster() {
    const y = Math.random() * (canvas.height - 60) + 30;
    monsters.push({
        x: canvas.width,
        y: y,
        width: 40,
        height: 40,
        health: 1
    });
}

// Crear bala
function createBullet() {
    bullets.push({
        x: bird.x + bird.width,
        y: bird.y + bird.height / 2 - 2,
        width: 8,
        height: 4
    });
}

// Dibujar monstruo
function drawMonster(monster) {
    ctx.save();
    ctx.translate(monster.x + monster.width / 2, monster.y + monster.height / 2);
    
    // Cuerpo del monstruo
    ctx.fillStyle = MONSTER_COLOR;
    ctx.beginPath();
    ctx.arc(0, 0, monster.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cuernos
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(-10, -15);
    ctx.lineTo(-8, -25);
    ctx.lineTo(-6, -15);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(6, -15);
    ctx.lineTo(8, -25);
    ctx.lineTo(10, -15);
    ctx.fill();
    
    // Ojos
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(-8, -5, 5, 0, Math.PI * 2);
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(-8, -5, 2, 0, Math.PI * 2);
    ctx.arc(8, -5, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Boca
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 5, 10, 0, Math.PI);
    ctx.stroke();
    
    // Dientes
    ctx.fillStyle = 'white';
    for (let i = -8; i < 8; i += 4) {
        ctx.fillRect(i, 5, 3, 6);
    }
    
    // Indicador de vida
    ctx.fillStyle = 'white';
    ctx.fillRect(-15, -20, 30, 3);
    ctx.fillStyle = monster.health === 1 ? '#2ecc71' : '#e74c3c';
    ctx.fillRect(-15, -20, (monster.health / 1) * 30, 3);
    
    ctx.restore();
}

// Dibujar bala
function drawBullet(bullet) {
    ctx.fillStyle = BULLET_COLOR;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(bullet.x + 5, bullet.y + 1, 3, 2);
}

// Actualizar el juego
function update() {
    if (!gameRunning) return;
    
    frameCount++;
    
    // Actualizar pájaro
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    
    // Crear tuberías cada 150 frames
    if (frameCount % 150 === 0) {
        createPipe();
    }
    
    // Crear monstruos cada 120 frames
    if (frameCount % 120 === 0) {
        createMonster();
    }
    
    // Actualizar balas
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += BULLET_SPEED;
        
        // Eliminar balas fuera de pantalla
        if (bullets[i].x > canvas.width) {
            bullets.splice(i, 1);
        }
    }
    
    // Actualizar monstruos
    for (let i = monsters.length - 1; i >= 0; i--) {
        monsters[i].x -= MONSTER_SPEED;
        
        // Verificar colisiones con balas
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (bullets[j].x < monsters[i].x + monsters[i].width &&
                bullets[j].x + bullets[j].width > monsters[i].x &&
                bullets[j].y < monsters[i].y + monsters[i].height &&
                bullets[j].y + bullets[j].height > monsters[i].y) {
                
                // Reducir vida del monstruo
                monsters[i].health--;
                bullets.splice(j, 1);
                
                // Eliminar monstruo si se queda sin vida
                if (monsters[i].health <= 0) {
                    monsters.splice(i, 1);
                    score += 5; // Bonus por eliminar monstruo
                    scoreDisplay.textContent = score;
                }
                break;
            }
        }
        
        // Eliminar monstruos fuera de pantalla
        if (monsters[i] && monsters[i].x + monsters[i].width < 0) {
            monsters.splice(i, 1);
        }
    }
    
    // Actualizar tuberías
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;
        
        // Contar puntos
        if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].scored = true;
            score++;
            scoreDisplay.textContent = score;
        }
        
        // Eliminar tuberías fuera de pantalla
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }
    
    // Verificar colisiones
    checkCollisions();
}

// Verificar colisiones
function checkCollisions() {
    // Colisión con el suelo o techo
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        gameOver();
        return;
    }
    
    // Colisión con tuberías
    for (let pipe of pipes) {
        if (bird.x + bird.width > pipe.x && 
            bird.x < pipe.x + PIPE_WIDTH) {
            if (bird.y < pipe.top || bird.y + bird.height > pipe.bottom) {
                gameOver();
                return;
            }
        }
    }
    
    // Colisión con monstruos
    for (let monster of monsters) {
        if (bird.x + bird.width > monster.x && 
            bird.x < monster.x + monster.width &&
            bird.y + bird.height > monster.y &&
            bird.y < monster.y + monster.height) {
            gameOver();
            return;
        }
    }
}

// Dibujar todo
function draw() {
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar indicadores de control en la parte inferior (solo si el juego está corriendo)
    if (gameRunning) {
        const controlHeight = canvas.height / 3;
        const controlY = canvas.height * 2 / 3;
        
        // Zona de salto (izquierda inferior)
        ctx.fillStyle = 'rgba(100, 150, 255, 0.15)';
        ctx.fillRect(0, controlY, canvas.width / 2, controlHeight);
        
        // Zona de disparo (derecha inferior)
        ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
        ctx.fillRect(canvas.width / 2, controlY, canvas.width / 2, controlHeight);
        
        // Línea divisoria vertical
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, controlY);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        
        // Línea horizontal superior
        ctx.beginPath();
        ctx.moveTo(0, controlY);
        ctx.lineTo(canvas.width, controlY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Iconos de texto
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↑ SALTAR', canvas.width / 4, controlY + controlHeight / 2 + 5);
        ctx.fillText('💥 DISPARAR', canvas.width * 3 / 4, controlY + controlHeight / 2 + 5);
    }
    
    // Dibujar tuberías
    pipes.forEach(pipe => drawPipe(pipe));
    
    // Dibujar monstruos
    monsters.forEach(monster => drawMonster(monster));
    
    // Dibujar balas
    bullets.forEach(bullet => drawBullet(bullet));
    
    // Dibujar pájaro
    drawBird();
}

// Bucle del juego
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Saltar
function jump() {
    if (!gameRunning) return;
    bird.velocity = bird.jump;
}

// Iniciar juego
function startGame() {
    init();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
}

// Game Over
function gameOver() {
    gameRunning = false;
    
    // Actualizar mejor puntuación
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
    }
    
    finalScoreDisplay.textContent = score;
    bestScoreDisplay.textContent = bestScore;
    scoreDisplay.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
}

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameRunning && !startScreen.classList.contains('hidden')) {
            startGame();
        } else {
            jump();
        }
    }
    if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        e.preventDefault();
        if (gameRunning) {
            createBullet();
        }
    }
});

canvas.addEventListener('click', (e) => {
    if (gameRunning) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Solo detectar clics en la parte inferior (último tercio)
        if (y > canvas.height * 2 / 3) {
            // Mitad izquierda: saltar, mitad derecha: disparar
            if (x < canvas.width / 2) {
                jump();
            } else {
                createBullet();
            }
        }
    }
});

// Eventos táctiles para móvil
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Solo detectar toques en la parte inferior (último tercio)
        if (y > canvas.height * 2 / 3) {
            // Mitad izquierda: saltar, mitad derecha: disparar
            if (x < canvas.width / 2) {
                jump();
            } else {
                createBullet();
            }
        }
    }
});

// Inicializar
init();
bestScoreDisplay.textContent = bestScore;
gameLoop();
