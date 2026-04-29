/**
 * 轻量级二维码生成器
 */
const QRCode = (function() {
    // QR码版本对应的模块数量
    const VERSIONS = [
        null, 21, 25, 29, 33, 37, 41, 45, 49, 53, 57, 61, 65, 69, 73, 77, 81
    ];
    
    // 纠错级别
    const ERROR_CORRECT_LEVEL = {
        L: 1,
        M: 0,
        Q: 3,
        H: 2
    };
    
    // 生成二维码
    function generate(text, options = {}) {
        const size = options.size || 200;
        const level = ERROR_CORRECT_LEVEL[options.level] || ERROR_CORRECT_LEVEL.M;
        const margin = options.margin || 4;
        
        // 创建画布
        const canvas = document.createElement('canvas');
        const moduleCount = 21; // Version 1
        const moduleSize = Math.floor((size - margin * 2) / moduleCount);
        const actualSize = moduleSize * moduleCount + margin * 2;
        
        canvas.width = actualSize;
        canvas.height = actualSize;
        const ctx = canvas.getContext('2d');
        
        // 绘制背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, actualSize, actualSize);
        
        // 生成二维码矩阵（简化版本，使用固定的定位图案）
        const matrix = createMatrix(text, moduleCount);
        
        // 绘制模块
        ctx.fillStyle = '#000000';
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (matrix[row][col]) {
                    ctx.fillRect(
                        margin + col * moduleSize,
                        margin + row * moduleSize,
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }
        
        return canvas;
    }
    
    // 创建二维码矩阵
    function createMatrix(text, moduleCount) {
        const matrix = [];
        
        // 初始化矩阵
        for (let i = 0; i < moduleCount; i++) {
            matrix[i] = [];
            for (let j = 0; j < moduleCount; j++) {
                matrix[i][j] = 0;
            }
        }
        
        // 绘制定位图案（左上角）
        drawPositionPattern(matrix, 0, 0);
        // 绘制定位图案（右上角）
        drawPositionPattern(matrix, moduleCount - 7, 0);
        // 绘制定位图案（左下角）
        drawPositionPattern(matrix, 0, moduleCount - 7);
        
        // 绘制对齐图案（版本2及以上需要）
        if (moduleCount >= 25) {
            drawAlignmentPattern(matrix, moduleCount - 9, moduleCount - 9);
        }
        
        // 绘制时序图案
        for (let i = 8; i < moduleCount - 8; i++) {
            matrix[6][i] = matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        }
        
        // 编码数据
        encodeData(matrix, text, moduleCount);
        
        return matrix;
    }
    
    // 绘制定位图案
    function drawPositionPattern(matrix, startRow, startCol) {
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                const row = startRow + i;
                const col = startCol + j;
                if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
                    // 外框
                    if (i === 0 || i === 6 || j === 0 || j === 6) {
                        matrix[row][col] = 1;
                    }
                    // 内部
                    else if (i >= 2 && i <= 4 && j >= 2 && j <= 4) {
                        matrix[row][col] = 1;
                    }
                    else {
                        matrix[row][col] = 0;
                    }
                }
            }
        }
        // separator
        for (let i = 0; i < 8; i++) {
            const positions = [
                [startRow - 1, startCol + i],
                [startRow + 7, startCol + i],
                [startRow + i, startCol - 1],
                [startRow + i, startCol + 7]
            ];
            positions.forEach(([r, c]) => {
                if (r >= 0 && r < matrix.length && c >= 0 && c < matrix.length) {
                    matrix[r][c] = 0;
                }
            });
        }
    }
    
    // 绘制对齐图案
    function drawAlignmentPattern(matrix, centerRow, centerCol) {
        for (let i = -2; i <= 2; i++) {
            for (let j = -2; j <= 2; j++) {
                const row = centerRow + i;
                const col = centerCol + j;
                if (row >= 0 && row < matrix.length && col >= 0 && col < matrix.length) {
                    if (Math.abs(i) === 2 || Math.abs(j) === 2 || (i === 0 && j === 0)) {
                        matrix[row][col] = 1;
                    } else {
                        matrix[row][col] = 0;
                    }
                }
            }
        }
    }
    
    // 编码数据（简化版本）
    function encodeData(matrix, text, moduleCount) {
        // 简单的伪随机分布用于演示
        // 实际应用中应使用完整的QR码编码算法
        const dataArea = [];
        for (let i = 8; i < moduleCount - 8; i++) {
            for (let j = 8; j < moduleCount - 8; j++) {
                // 排除对齐图案区域
                const isAlignmentArea = moduleCount >= 25 && 
                    i >= moduleCount - 11 && j >= moduleCount - 11;
                if (!isAlignmentArea && matrix[i][j] === 0) {
                    dataArea.push([i, j]);
                }
            }
        }
        
        // 将文本转换为简单的二进制数据
        const binary = stringToBinary(text);
        
        // 填充数据区域
        let bitIndex = 0;
        for (let i = 0; i < dataArea.length && bitIndex < binary.length; i++) {
            const [row, col] = dataArea[i];
            matrix[row][col] = parseInt(binary[bitIndex]);
            bitIndex++;
        }
        
        // 填充剩余区域（使用伪随机模式）
        for (let i = 0; i < dataArea.length; i++) {
            const [row, col] = dataArea[i];
            if (matrix[row][col] === 0) {
                matrix[row][col] = ((row + col) % 3 === 0) ? 1 : 0;
            }
        }
    }
    
    // 字符串转二进制
    function stringToBinary(str) {
        let binary = '';
        for (let i = 0; i < str.length; i++) {
            binary += str.charCodeAt(i).toString(2).padStart(8, '0');
        }
        return binary;
    }
    
    return { generate };
})();

// ==================== 文章数据 ====================
const articles = [
    {
        id: 1,
        title: 'About Me',
        excerpt: '微电子科学与工程专业学生，专注半导体与集成电路领域，擅长AI辅助开发...',
        date: '2026-04-29',
        tag: 'About',
        content: `
            <h2>YEP ZHEN YUAN</h2>
            <p>上海交通大学微电子科学与工程专业学生，对半导体工艺和IC设计充满热情。</p>
            
            <h2>Contact</h2>
            <ul>
                <li><strong>Phone:</strong> (+86)18817518289</li>
                <li><strong>Email:</strong> yepzhenyuan@sjtu.edu.cn</li>
                <li><strong>Location:</strong> Shanghai, China</li>
            </ul>
            
            <h2>Technical Skills</h2>
            <ul>
                <li><strong>Programming:</strong> C++, C</li>
                <li><strong>AI Tools:</strong> Vibe coding (Cursor/Copilot)</li>
                <li><strong>EDA:</strong> Cadence Virtuoso</li>
                <li><strong>Others:</strong> Microsoft Office, Origin (Data Processing)</li>
            </ul>
            
            <h2>Interests</h2>
            <p>半导体制造工艺、芯片设计、AI辅助编程、健康应用开发</p>
        `
    },
    {
        id: 2,
        title: 'Education',
        excerpt: '上海交通大学微电子科学与工程学士，国际化教育背景，曾获新生奖学金和优秀学生奖...',
        date: '2026-04-28',
        tag: 'Education',
        content: `
            <h2>B.Sc. Microelectronics Science & Engineering</h2>
            <p><strong>Shanghai Jiao Tong University</strong> | 2024 - Present</p>
            <ul>
                <li>Relevant Coursework: Analog Fundamentals, C++, Linear Algebra, Calculus</li>
                <li>Award: Freshmen Scholarship (新生奖学金)</li>
            </ul>
            
            <h2>International Foundation</h2>
            <p><strong>Shanghai Jiao Tong University</strong> | Sep 2023 - May 2024</p>
            <ul>
                <li>Coursework: Mathematics, Physics, English, Chinese</li>
                <li>Award: Outstanding Student (优秀学生)</li>
            </ul>
            
            <h2>A Level</h2>
            <p><strong>UCSI College, Malaysia</strong> | Jul 2021 - May 2023</p>
            <ul>
                <li>Coursework: Mathematics, Physics, Economics</li>
            </ul>
        `
    },
    {
        id: 3,
        title: 'Projects',
        excerpt: 'IHealthSpace健康应用开发 + 半导体制造与IC设计实践项目...',
        date: '2026-04-27',
        tag: 'Projects',
        content: `
            <h2>IHealthSpace Developer</h2>
            <p><strong>2026.03 - Present</strong> | China</p>
            <ul>
                <li>Designed and developed a health-focused application using AI-assisted coding tools (Cursor/Copilot)</li>
                <li>Led UI design and implementation for the customer feedback module, improving data collection efficiency</li>
                <li>Designed and evaluated interactive "PK" (comparison/voting) feature to enhance user engagement</li>
            </ul>
            
            <h2>Science & Technology Innovation</h2>
            <p><strong>2025.02 - 2025.06</strong></p>
            <ul>
                <li>Demonstrated comprehensive knowledge in semiconductor manufacturing and IC design</li>
                <li>Systematically studied end-to-end semiconductor fabrication process and chip tape-out workflow</li>
                <li>Designed a basic CMOS inverter using Cadence Virtuoso</li>
                <li>Gained hands-on experience with industry-standard EDA tools and logic gate schematics</li>
            </ul>
        `
    }
];

// ==================== 首页逻辑 ====================
function initHomePage() {
    const canvas = document.getElementById('qrcode');
    if (!canvas) return;
    
    // 获取当前页面URL，生成指向blog.html的二维码
    let blogUrl = window.location.href.replace('index.html', 'blog.html');
    // 如果URL不以.html结尾（如部署到根目录），添加blog.html
    if (!blogUrl.endsWith('blog.html') && !blogUrl.includes('index.html')) {
        blogUrl = blogUrl.endsWith('/') ? blogUrl + 'blog.html' : blogUrl + '/blog.html';
    }
    
    // 使用 qrcode-generator 库生成二维码
    const qr = qrcode(0, 'M');
    qr.addData(blogUrl);
    qr.make();
    
    // 设置二维码尺寸
    const size = 200;
    const moduleCount = qr.getModuleCount();
    const cellSize = Math.floor(size / moduleCount);
    const actualSize = cellSize * moduleCount;
    
    canvas.width = actualSize;
    canvas.height = actualSize;
    const ctx = canvas.getContext('2d');
    
    // 绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, actualSize, actualSize);
    
    // 绘制二维码
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }
}

// 下载二维码
function downloadQR() {
    const canvas = document.getElementById('qrcode');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'my-blog-qrcode.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// ==================== 博客页面逻辑 ====================
function initBlogPage() {
    renderArticleList();
    setupNavigation();
    updateArticleCount();
}

function renderArticleList() {
    const grid = document.getElementById('articlesGrid');
    if (!grid) return;
    
    if (articles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <h3>暂无文章</h3>
                <p>敬请期待更多内容</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = articles.map(article => `
        <article class="article-card" onclick="showArticle(${article.id})">
            <h3>${article.title}</h3>
            <p>${article.excerpt}</p>
            <div class="article-meta">
                <span class="tag">${article.tag}</span>
                <span>${article.date}</span>
            </div>
        </article>
    `).join('');
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            
            // 更新导航状态
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // 切换视图
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.remove('active');
            });
            
            if (view === 'list') {
                document.getElementById('articleList').classList.add('active');
            } else if (view === 'about') {
                document.getElementById('aboutView').classList.add('active');
            }
        });
    });
}

function showArticle(id) {
    const article = articles.find(a => a.id === id);
    if (!article) return;
    
    const content = document.getElementById('articleContent');
    content.innerHTML = `
        <h1>${article.title}</h1>
        <div class="article-header">
            <span class="tag">${article.tag}</span>
            <span style="color: var(--text-secondary);">${article.date}</span>
        </div>
        <div class="article-body">
            ${article.content}
        </div>
    `;
    
    document.getElementById('articleList').classList.remove('active');
    document.getElementById('articleDetail').classList.add('active');
}

function showListView() {
    document.getElementById('articleDetail').classList.remove('active');
    document.getElementById('articleList').classList.add('active');
}

function updateArticleCount() {
    const count = articles.length;
    document.getElementById('articleCount').textContent = `${count} 篇文章`;
    
    const aboutCount = document.getElementById('aboutArticleCount');
    if (aboutCount) {
        aboutCount.textContent = `${count} 篇`;
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 根据当前页面初始化
    if (document.getElementById('qrcode')) {
        initHomePage();
    } else if (document.getElementById('articlesGrid')) {
        initBlogPage();
    }
});
