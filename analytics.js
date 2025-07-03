// Advanced Analytics and Insights Module

class WebsiteAnalytics {
    constructor() {
        this.charts = {};
        this.initializeAnalytics();
    }

    initializeAnalytics() {
        // Add analytics section to the results area
        this.createAnalyticsSection();
        this.setupAnalyticsEventListeners();
    }

    createAnalyticsSection() {
        const resultsSection = document.querySelector('.results-section');
        const analyticsHTML = `
            <div class="analytics-section" id="analyticsSection" style="display: none;">
                <div class="analytics-header">
                    <h3><i class="fas fa-chart-bar"></i> Data Insights & Analytics</h3>
                    <button class="btn btn-outline" id="toggleAnalytics">
                        <i class="fas fa-chart-line"></i> Show Analytics
                    </button>
                </div>
                
                <div class="analytics-content" id="analyticsContent" style="display: none;">
                    <div class="analytics-grid">
                        <!-- Key Metrics -->
                        <div class="analytics-card">
                            <h4><i class="fas fa-tachometer-alt"></i> Key Metrics</h4>
                            <div class="metrics-grid">
                                <div class="metric-item">
                                    <span class="metric-value" id="avgTraffic">0</span>
                                    <span class="metric-label">Avg Traffic</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-value" id="totalWebsites">0</span>
                                    <span class="metric-label">Total Websites</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-value" id="topCategory">-</span>
                                    <span class="metric-label">Top Category</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-value" id="avgRelevance">0%</span>
                                    <span class="metric-label">Avg Relevance</span>
                                </div>
                            </div>
                        </div>

                        <!-- Traffic Distribution Chart -->
                        <div class="analytics-card">
                            <h4><i class="fas fa-chart-area"></i> Traffic Distribution</h4>
                            <canvas id="trafficChart" width="400" height="200"></canvas>
                        </div>

                        <!-- Category Distribution -->
                        <div class="analytics-card">
                            <h4><i class="fas fa-chart-pie"></i> Category Breakdown</h4>
                            <canvas id="categoryChart" width="400" height="200"></canvas>
                        </div>

                        <!-- Geographic Distribution -->
                        <div class="analytics-card">
                            <h4><i class="fas fa-globe"></i> Geographic Distribution</h4>
                            <div class="geo-stats" id="geoStats"></div>
                        </div>

                        <!-- TLD Analysis -->
                        <div class="analytics-card">
                            <h4><i class="fas fa-link"></i> Domain Extension Analysis</h4>
                            <div class="tld-stats" id="tldStats"></div>
                        </div>

                        <!-- Performance Insights -->
                        <div class="analytics-card full-width">
                            <h4><i class="fas fa-lightbulb"></i> Performance Insights</h4>
                            <div class="insights-list" id="insightsList"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultsSection.insertAdjacentHTML('afterbegin', analyticsHTML);
    }

    setupAnalyticsEventListeners() {
        const toggleBtn = document.getElementById('toggleAnalytics');
        const analyticsContent = document.getElementById('analyticsContent');
        let isVisible = false;

        toggleBtn.addEventListener('click', () => {
            isVisible = !isVisible;
            analyticsContent.style.display = isVisible ? 'block' : 'none';
            toggleBtn.innerHTML = isVisible 
                ? '<i class="fas fa-chart-line"></i> Hide Analytics'
                : '<i class="fas fa-chart-line"></i> Show Analytics';
            
            if (isVisible && filteredData.length > 0) {
                this.updateAnalytics();
            }
        });
    }

    updateAnalytics() {
        if (filteredData.length === 0) return;

        this.updateKeyMetrics();
        this.updateTrafficChart();
        this.updateCategoryChart();
        this.updateGeographicStats();
        this.updateTLDStats();
        this.generateInsights();
        
        document.getElementById('analyticsSection').style.display = 'block';
    }

    updateKeyMetrics() {
        const totalTraffic = filteredData.reduce((sum, item) => sum + item.traffic, 0);
        const avgTraffic = Math.round(totalTraffic / filteredData.length);
        const avgRelevance = filteredData.reduce((sum, item) => sum + item.relevance, 0) / filteredData.length;
        
        // Find top category
        const categoryCounts = {};
        filteredData.forEach(item => {
            item.categories.forEach(cat => {
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
        });
        const topCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || '-';

        document.getElementById('avgTraffic').textContent = this.formatNumber(avgTraffic);
        document.getElementById('totalWebsites').textContent = filteredData.length;
        document.getElementById('topCategory').textContent = topCategory;
        document.getElementById('avgRelevance').textContent = (avgRelevance * 100).toFixed(1) + '%';
    }

    updateTrafficChart() {
        const canvas = document.getElementById('trafficChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create traffic ranges
        const ranges = [
            { label: '0-1K', min: 0, max: 1000 },
            { label: '1K-10K', min: 1000, max: 10000 },
            { label: '10K-100K', min: 10000, max: 100000 },
            { label: '100K-1M', min: 100000, max: 1000000 },
            { label: '1M+', min: 1000000, max: Infinity }
        ];
        
        const rangeCounts = ranges.map(range => 
            filteredData.filter(item => item.traffic >= range.min && item.traffic < range.max).length
        );
        
        this.drawBarChart(ctx, ranges.map(r => r.label), rangeCounts, '#4A90E2');
    }

    updateCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const categoryCounts = {};
        filteredData.forEach(item => {
            item.categories.forEach(cat => {
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
        });
        
        const sortedCategories = Object.entries(categoryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 categories
        
        const labels = sortedCategories.map(([cat]) => cat);
        const values = sortedCategories.map(([,count]) => count);
        const colors = this.generateColors(labels.length);
        
        this.drawPieChart(ctx, labels, values, colors);
    }

    updateGeographicStats() {
        const geoStats = document.getElementById('geoStats');
        const countryCounts = {};
        
        filteredData.forEach(item => {
            countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
        });
        
        const sortedCountries = Object.entries(countryCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        const countryFlags = {
            'us': '🇺🇸', 'uk': '🇬🇧', 'ca': '🇨🇦', 'au': '🇦🇺', 
            'de': '🇩🇪', 'fr': '🇫🇷', 'unknown': '🌍'
        };
        
        geoStats.innerHTML = sortedCountries.map(([country, count]) => `
            <div class="stat-item">
                <span class="stat-flag">${countryFlags[country] || '🌍'}</span>
                <span class="stat-label">${country.toUpperCase()}</span>
                <span class="stat-value">${count}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${(count / filteredData.length) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    updateTLDStats() {
        const tldStats = document.getElementById('tldStats');
        const tldCounts = {};
        
        filteredData.forEach(item => {
            tldCounts[item.tld] = (tldCounts[item.tld] || 0) + 1;
        });
        
        const sortedTLDs = Object.entries(tldCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        tldStats.innerHTML = sortedTLDs.map(([tld, count]) => `
            <div class="stat-item">
                <span class="stat-label">${tld}</span>
                <span class="stat-value">${count}</span>
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${(count / filteredData.length) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    generateInsights() {
        const insights = [];
        
        // Traffic insights
        const avgTraffic = filteredData.reduce((sum, item) => sum + item.traffic, 0) / filteredData.length;
        const highTrafficSites = filteredData.filter(item => item.traffic > avgTraffic * 2).length;
        
        if (highTrafficSites > 0) {
            insights.push({
                type: 'traffic',
                text: `${highTrafficSites} websites have traffic significantly above average (${this.formatNumber(Math.round(avgTraffic * 2))}+)`
            });
        }
        
        // Category insights
        const categoryCounts = {};
        filteredData.forEach(item => {
            item.categories.forEach(cat => {
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
        });
        
        const dominantCategory = Object.entries(categoryCounts).sort(([,a], [,b]) => b - a)[0];
        if (dominantCategory) {
            const percentage = ((dominantCategory[1] / filteredData.length) * 100).toFixed(1);
            insights.push({
                type: 'category',
                text: `${dominantCategory[0]} category dominates with ${percentage}% of websites`
            });
        }
        
        // Relevance insights
        const highRelevanceSites = filteredData.filter(item => item.relevance > 0.1).length;
        if (highRelevanceSites > 0) {
            const percentage = ((highRelevanceSites / filteredData.length) * 100).toFixed(1);
            insights.push({
                type: 'relevance',
                text: `${percentage}% of websites show high relevance (>10%)`
            });
        }
        
        // Geographic insights
        const countryCounts = {};
        filteredData.forEach(item => {
            countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
        });
        
        const topCountry = Object.entries(countryCounts).sort(([,a], [,b]) => b - a)[0];
        if (topCountry && topCountry[1] > filteredData.length * 0.3) {
            insights.push({
                type: 'geographic',
                text: `${topCountry[0].toUpperCase()} dominates geographically with ${topCountry[1]} websites`
            });
        }
        
        const insightsList = document.getElementById('insightsList');
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i class="fas fa-${this.getInsightIcon(insight.type)}"></i>
                <span>${insight.text}</span>
            </div>
        `).join('');
    }

    getInsightIcon(type) {
        const icons = {
            traffic: 'chart-line',
            category: 'tags',
            relevance: 'star',
            geographic: 'globe'
        };
        return icons[type] || 'lightbulb';
    }

    drawBarChart(ctx, labels, values, color) {
        const padding = 40;
        const chartWidth = ctx.canvas.width - padding * 2;
        const chartHeight = ctx.canvas.height - padding * 2;
        const barWidth = chartWidth / labels.length;
        const maxValue = Math.max(...values);
        
        // Draw bars
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            const x = padding + index * barWidth + barWidth * 0.1;
            const y = padding + chartHeight - barHeight;
            const width = barWidth * 0.8;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y, width, barHeight);
            
            // Draw labels
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x + width / 2, ctx.canvas.height - 10);
            
            // Draw values
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(value.toString(), x + width / 2, y - 5);
        });
    }

    drawPieChart(ctx, labels, values, colors) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 20;
        const total = values.reduce((sum, val) => sum + val, 0);
        
        let currentAngle = -Math.PI / 2;
        
        values.forEach((value, index) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 15);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 15);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    generateColors(count) {
        const colors = [
            '#4A90E2', '#68D391', '#F6AD55', '#FC8181', '#9F7AEA',
            '#4FD1C7', '#F687B3', '#A78BFA', '#34D399', '#FBBF24'
        ];
        return colors.slice(0, count);
    }

    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
}

// Export functionality for preset management
class PresetManager {
    constructor() {
        this.presets = this.loadPresets();
        this.createPresetUI();
    }

    loadPresets() {
        const presets = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('filter_preset_')) {
                const presetName = key.replace('filter_preset_', '');
                presets[presetName] = JSON.parse(localStorage.getItem(key));
            }
        }
        return presets;
    }

    createPresetUI() {
        const filterActions = document.querySelector('.filter-actions');
        const presetHTML = `
            <div class="preset-section">
                <h4><i class="fas fa-bookmark"></i> Saved Presets</h4>
                <div class="preset-list" id="presetList"></div>
                <div class="preset-actions">
                    <select id="presetSelect" class="preset-select">
                        <option value="">Select a preset...</option>
                    </select>
                    <button class="btn btn-outline" id="loadPreset">
                        <i class="fas fa-upload"></i> Load
                    </button>
                    <button class="btn btn-outline" id="deletePreset">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        filterActions.insertAdjacentHTML('beforebegin', presetHTML);
        this.updatePresetList();
        this.setupPresetEventListeners();
    }

    updatePresetList() {
        const presetSelect = document.getElementById('presetSelect');
        const presetNames = Object.keys(this.presets);
        
        presetSelect.innerHTML = '<option value="">Select a preset...</option>' +
            presetNames.map(name => `<option value="${name}">${name}</option>`).join('');
    }

    setupPresetEventListeners() {
        document.getElementById('loadPreset').addEventListener('click', () => {
            const selectedPreset = document.getElementById('presetSelect').value;
            if (selectedPreset) {
                this.loadPreset(selectedPreset);
            }
        });

        document.getElementById('deletePreset').addEventListener('click', () => {
            const selectedPreset = document.getElementById('presetSelect').value;
            if (selectedPreset && confirm(`Delete preset "${selectedPreset}"?`)) {
                this.deletePreset(selectedPreset);
            }
        });
    }

    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        // Clear current filters
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        // Apply preset filters
        preset.businessAreas?.forEach(value => {
            const checkbox = document.querySelector(`.business-area[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        preset.websitePurposes?.forEach(value => {
            const checkbox = document.querySelector(`.website-purpose[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        preset.generalCategories?.forEach(value => {
            const checkbox = document.querySelector(`.general-category[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        preset.countries?.forEach(value => {
            const checkbox = document.querySelector(`.country-filter[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        preset.tlds?.forEach(value => {
            const checkbox = document.querySelector(`.tld-filter[value="${value}"]`);
            if (checkbox) checkbox.checked = true;
        });

        document.getElementById('minTraffic').value = preset.minTraffic || '';
        document.getElementById('maxTraffic').value = preset.maxTraffic || '';
        document.getElementById('softwareSaas').checked = preset.softwareSaas || false;

        // Apply filters
        applyFilters();
        showSuccessMessage(`Preset "${presetName}" loaded successfully!`);
    }

    deletePreset(presetName) {
        localStorage.removeItem(`filter_preset_${presetName}`);
        delete this.presets[presetName];
        this.updatePresetList();
        showSuccessMessage(`Preset "${presetName}" deleted successfully!`);
    }
}

// Initialize analytics and preset manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.analytics = new WebsiteAnalytics();
    window.presetManager = new PresetManager();
    
    // Update analytics when filters change
    const originalApplyFilters = window.applyFilters;
    window.applyFilters = function() {
        originalApplyFilters();
        if (document.getElementById('analyticsContent').style.display === 'block') {
            window.analytics.updateAnalytics();
        }
    };
});

