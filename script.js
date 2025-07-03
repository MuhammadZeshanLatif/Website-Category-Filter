// Global variables
let websiteData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 20;
let sortColumn = '';
let sortDirection = 'asc';

// Category mappings for automatic categorization
const categoryMappings = {
    fashion: ['fashion', 'clothing', 'apparel', 'style', 'wear', 'boutique', 'dress', 'shoes'],
    ecommerce: ['shop', 'store', 'buy', 'sell', 'commerce', 'retail', 'marketplace', 'cart'],
    tech: ['tech', 'software', 'app', 'digital', 'code', 'dev', 'ai', 'data'],
    health: ['health', 'medical', 'wellness', 'fitness', 'care', 'hospital', 'doctor'],
    business: ['business', 'corporate', 'company', 'enterprise', 'professional', 'service'],
    lifestyle: ['lifestyle', 'living', 'home', 'life', 'personal', 'daily'],
    education: ['education', 'learn', 'school', 'university', 'course', 'training', 'study'],
    sports: ['sport', 'fitness', 'gym', 'athletic', 'exercise', 'game', 'team'],
    photography: ['photo', 'camera', 'image', 'picture', 'visual', 'gallery']
};

// Country mappings for domain detection
const countryMappings = {
    'us': ['.com', '.us'],
    'uk': ['.uk', '.co.uk'],
    'ca': ['.ca'],
    'au': ['.au', '.com.au'],
    'de': ['.de'],
    'fr': ['.fr']
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    setupDragAndDrop();
});

// Event listeners setup
function initializeEventListeners() {
    // File upload
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Filter controls
    document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('savePreset').addEventListener('click', saveFilterPreset);
    
    // Results controls
    document.getElementById('exportResults').addEventListener('click', exportResults);
    document.getElementById('searchResults').addEventListener('input', debounce(searchResults, 300));
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(currentPage - 1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(currentPage + 1));
    
    // Table sorting
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => sortTable(header.dataset.column));
    });
    
    // Filter change listeners
    document.querySelectorAll('input[type="checkbox"], input[type="number"]').forEach(input => {
        input.addEventListener('change', debounce(applyFilters, 300));
    });
}

// Drag and drop setup
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    uploadArea.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file) return;
    
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['csv', 'xlsx', 'xls'];
    
    if (!validExtensions.includes(fileExtension)) {
        alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
    }
    
    showLoading(true);
    showProgress(0);
    
    if (fileExtension === 'csv') {
        parseCSV(file);
    } else {
        parseExcel(file);
    }
}

// CSV parsing
function parseCSV(file) {
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            processData(results.data);
        },
        error: function(error) {
            console.error('CSV parsing error:', error);
            alert('Error parsing CSV file: ' + error.message);
            showLoading(false);
        }
    });
}

// Excel parsing
function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            processData(jsonData);
        } catch (error) {
            console.error('Excel parsing error:', error);
            alert('Error parsing Excel file: ' + error.message);
            showLoading(false);
        }
    };
    reader.readAsArrayBuffer(file);
}

// Data processing
function processData(rawData) {
    try {
        websiteData = rawData.map((row, index) => {
            const domain = row.Domain || row.domain || '';
            const traffic = parseInt(row['Organic Traffic'] || row.traffic || 0);
            const relevance = parseFloat(row['Competitor Relevance'] || row.relevance || 0);
            const keywords = parseInt(row['Organic Keywords'] || row.keywords || 0);
            const cost = parseFloat(row['Organic Cost'] || row.cost || 0);
            
            return {
                id: index,
                domain: domain,
                traffic: traffic,
                relevance: relevance,
                keywords: keywords,
                cost: cost,
                categories: detectCategories(domain),
                country: detectCountry(domain),
                tld: extractTLD(domain)
            };
        }).filter(item => item.domain); // Remove empty domains
        
        showProgress(100);
        setTimeout(() => {
            showLoading(false);
            displayResults();
            showSuccessMessage(`Successfully loaded ${websiteData.length} websites`);
        }, 500);
        
    } catch (error) {
        console.error('Data processing error:', error);
        alert('Error processing data: ' + error.message);
        showLoading(false);
    }
}

// Category detection
function detectCategories(domain) {
    const categories = [];
    const domainLower = domain.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryMappings)) {
        if (keywords.some(keyword => domainLower.includes(keyword))) {
            categories.push(category);
        }
    }
    
    // Default category if none detected
    if (categories.length === 0) {
        categories.push('general');
    }
    
    return categories;
}

// Country detection
function detectCountry(domain) {
    const domainLower = domain.toLowerCase();
    
    for (const [country, tlds] of Object.entries(countryMappings)) {
        if (tlds.some(tld => domainLower.endsWith(tld))) {
            return country;
        }
    }
    
    return 'unknown';
}

// TLD extraction
function extractTLD(domain) {
    const parts = domain.split('.');
    return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
}

// Filtering
function applyFilters() {
    if (websiteData.length === 0) return;
    
    filteredData = websiteData.filter(item => {
        // Traffic filters
        const minTraffic = parseInt(document.getElementById('minTraffic').value) || 0;
        const maxTraffic = parseInt(document.getElementById('maxTraffic').value) || Infinity;
        
        if (item.traffic < minTraffic || item.traffic > maxTraffic) {
            return false;
        }
        
        // Business area filters
        const businessAreas = getCheckedValues('.business-area');
        if (businessAreas.length > 0) {
            const hasBusinessArea = businessAreas.some(area => {
                switch(area) {
                    case 'digital-marketing': return item.categories.includes('business') || item.categories.includes('tech');
                    case 'business-finance': return item.categories.includes('business');
                    case 'real-estate': return item.categories.includes('business');
                    case 'ecommerce': return item.categories.includes('ecommerce');
                    default: return false;
                }
            });
            if (!hasBusinessArea) return false;
        }
        
        // Website purpose filters
        const websitePurposes = getCheckedValues('.website-purpose');
        if (websitePurposes.length > 0) {
            const hasPurpose = websitePurposes.some(purpose => {
                switch(purpose) {
                    case 'blog-guest-posting': return item.categories.includes('education') || item.categories.includes('lifestyle');
                    case 'service-based': return item.categories.includes('business');
                    case 'ecommerce-site': return item.categories.includes('ecommerce');
                    default: return false;
                }
            });
            if (!hasPurpose) return false;
        }
        
        // General category filters
        const generalCategories = getCheckedValues('.general-category');
        if (generalCategories.length > 0) {
            const hasCategory = generalCategories.some(category => item.categories.includes(category));
            if (!hasCategory) return false;
        }
        
        // Country filters
        const countries = getCheckedValues('.country-filter');
        if (countries.length > 0 && !countries.includes(item.country)) {
            return false;
        }
        
        // TLD filters
        const tlds = getCheckedValues('.tld-filter');
        if (tlds.length > 0) {
            const hasTLD = tlds.some(tld => item.tld.includes('.' + tld));
            if (!hasTLD) return false;
        }
        
        return true;
    });
    
    // Apply search filter
    const searchTerm = document.getElementById('searchResults').value.toLowerCase();
    if (searchTerm) {
        filteredData = filteredData.filter(item => 
            item.domain.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    displayResults();
    updateCategorySummary();
}

// Get checked values from checkboxes
function getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector + ':checked')).map(cb => cb.value);
}

// Search functionality
function searchResults() {
    applyFilters();
}

// Display results
function displayResults() {
    const tbody = document.getElementById('resultsTableBody');
    const resultsCount = document.getElementById('resultsCount');
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="6">
                    <div class="no-data-message">
                        <i class="fas fa-search"></i>
                        <p>No results found matching your filters</p>
                    </div>
                </td>
            </tr>
        `;
        resultsCount.textContent = '(0)';
        document.getElementById('pagination').style.display = 'none';
        return;
    }
    
    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Generate table rows
    tbody.innerHTML = pageData.map(item => `
        <tr>
            <td>
                <a href="https://${item.domain}" target="_blank" class="domain-link">
                    ${item.domain}
                </a>
            </td>
            <td>
                <span class="traffic-value">${formatNumber(item.traffic)}</span>
            </td>
            <td>
                <span class="relevance-score">${(item.relevance * 100).toFixed(1)}%</span>
            </td>
            <td>${formatNumber(item.keywords)}</td>
            <td>
                <div class="category-tags">
                    ${item.categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
                </div>
            </td>
            <td>
                <span class="tld-badge">${item.tld}</span>
            </td>
        </tr>
    `).join('');
    
    resultsCount.textContent = `(${filteredData.length})`;
    updatePagination();
}

// Update category summary
function updateCategorySummary() {
    const summary = document.getElementById('categorySummary');
    const summaryTags = document.getElementById('summaryTags');
    
    if (filteredData.length === 0) {
        summary.style.display = 'none';
        return;
    }
    
    // Count categories
    const categoryCounts = {};
    filteredData.forEach(item => {
        item.categories.forEach(category => {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
    });
    
    // Generate summary tags
    summaryTags.innerHTML = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([category, count]) => `
            <span class="summary-tag">${category}: ${count}</span>
        `).join('');
    
    summary.style.display = 'block';
}

// Pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'flex';
    
    // Update buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    const pageNumbersHTML = [];
    
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersHTML.push(`
            <button class="page-number ${i === currentPage ? 'active' : ''}" 
                    onclick="changePage(${i})">${i}</button>
        `);
    }
    
    pageNumbers.innerHTML = pageNumbersHTML.join('');
}

function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    displayResults();
}

// Table sorting
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    filteredData.sort((a, b) => {
        let aVal = a[column];
        let bVal = b[column];
        
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Update sort indicators
    document.querySelectorAll('.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    const currentHeader = document.querySelector(`[data-column="${column}"] i`);
    currentHeader.className = `fas fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`;
    
    displayResults();
}

// Clear filters
function clearAllFilters() {
    // Clear all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    
    // Clear number inputs
    document.getElementById('minTraffic').value = '';
    document.getElementById('maxTraffic').value = '';
    
    // Clear search
    document.getElementById('searchResults').value = '';
    
    // Reset filters
    filteredData = [...websiteData];
    currentPage = 1;
    displayResults();
    updateCategorySummary();
}

// Export results
function exportResults() {
    if (filteredData.length === 0) {
        alert('No data to export');
        return;
    }
    
    const csvContent = [
        ['Domain', 'Traffic', 'Relevance', 'Keywords', 'Categories', 'TLD'].join(','),
        ...filteredData.map(item => [
            item.domain,
            item.traffic,
            item.relevance,
            item.keywords,
            item.categories.join(';'),
            item.tld
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered_websites_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Save filter preset
function saveFilterPreset() {
    const presetName = prompt('Enter a name for this filter preset:');
    if (!presetName) return;
    
    const preset = {
        businessAreas: getCheckedValues('.business-area'),
        websitePurposes: getCheckedValues('.website-purpose'),
        generalCategories: getCheckedValues('.general-category'),
        countries: getCheckedValues('.country-filter'),
        tlds: getCheckedValues('.tld-filter'),
        minTraffic: document.getElementById('minTraffic').value,
        maxTraffic: document.getElementById('maxTraffic').value,
        softwareSaas: document.getElementById('softwareSaas').checked
    };
    
    localStorage.setItem(`filter_preset_${presetName}`, JSON.stringify(preset));
    alert(`Filter preset "${presetName}" saved successfully!`);
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function showLoading(show) {
    document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}

function showProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const uploadProgress = document.getElementById('uploadProgress');
    
    if (percent > 0) {
        uploadProgress.style.display = 'block';
        progressFill.style.width = percent + '%';
        progressText.textContent = percent + '%';
    } else {
        uploadProgress.style.display = 'none';
    }
}

function showSuccessMessage(message) {
    // Create temporary success message
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1001;
        animation: slideIn 0.3s ease;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for success message animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);



// Enhanced Filter Management
let activeFilters = {
    workgineFocus: [],
    businessAreas: [],
    websitePurpose: [],
    generalCategories: [],
    countries: [],
    tlds: [],
    trafficMin: null,
    trafficMax: null
};

// Enhanced Category Mappings
const enhancedCategoryMappings = {
    // Business Areas
    'digital-marketing': ['seo', 'marketing', 'digital', 'advertising', 'social', 'media', 'campaign'],
    'business-finance': ['business', 'finance', 'financial', 'investment', 'banking', 'money', 'accounting'],
    'real-estate': ['real', 'estate', 'property', 'realty', 'homes', 'housing', 'rental'],
    'automotive': ['auto', 'car', 'vehicle', 'automotive', 'motor', 'truck', 'bike'],
    'home-improvement': ['home', 'improvement', 'garden', 'diy', 'renovation', 'construction', 'tools'],
    
    // Website Purpose
    'blog-guest': ['blog', 'guest', 'post', 'article', 'news', 'magazine', 'journal'],
    'service-based': ['service', 'consulting', 'agency', 'professional', 'expert', 'solution'],
    'ecommerce': ['shop', 'store', 'buy', 'sell', 'commerce', 'retail', 'marketplace', 'cart'],
    
    // General Categories
    'business': ['business', 'corporate', 'company', 'enterprise', 'commercial'],
    'tech': ['tech', 'technology', 'software', 'app', 'digital', 'code', 'dev', 'ai', 'data'],
    'fashion': ['fashion', 'clothing', 'apparel', 'style', 'wear', 'boutique', 'designer'],
    'sports': ['sport', 'fitness', 'gym', 'athletic', 'exercise', 'training', 'workout'],
    'travel': ['travel', 'tourism', 'vacation', 'trip', 'hotel', 'flight', 'destination'],
    'crypto': ['crypto', 'bitcoin', 'blockchain', 'cryptocurrency', 'trading', 'coin'],
    'finance': ['finance', 'financial', 'investment', 'banking', 'money', 'loan', 'credit'],
    'education': ['education', 'learning', 'school', 'university', 'course', 'training', 'study'],
    'health': ['health', 'medical', 'wellness', 'fitness', 'care', 'hospital', 'doctor'],
    'law': ['law', 'legal', 'attorney', 'lawyer', 'court', 'justice', 'litigation'],
    'lifestyle': ['lifestyle', 'living', 'life', 'personal', 'daily', 'routine'],
    'wedding': ['wedding', 'marriage', 'bride', 'groom', 'ceremony', 'bridal'],
    'pets': ['pet', 'animal', 'dog', 'cat', 'veterinary', 'vet', 'puppy'],
    'photography': ['photo', 'photography', 'camera', 'picture', 'image', 'visual'],
    'entertainment': ['entertainment', 'movie', 'music', 'game', 'fun', 'celebrity'],
    'food': ['food', 'restaurant', 'recipe', 'cooking', 'cuisine', 'dining', 'chef']
};

// Initialize Enhanced Filters
function initializeEnhancedFilters() {
    // Select All / Unselect All for Countries
    document.getElementById('selectAllCountries').addEventListener('click', function() {
        document.querySelectorAll('.country-filter').forEach(checkbox => {
            checkbox.checked = true;
        });
        updateActiveFilters();
    });

    document.getElementById('unselectAllCountries').addEventListener('click', function() {
        document.querySelectorAll('.country-filter').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateActiveFilters();
    });

    // Select All / Unselect All for TLDs
    document.getElementById('selectAllTlds').addEventListener('click', function() {
        document.querySelectorAll('.tld-filter').forEach(checkbox => {
            checkbox.checked = true;
        });
        updateActiveFilters();
    });

    document.getElementById('unselectAllTlds').addEventListener('click', function() {
        document.querySelectorAll('.tld-filter').forEach(checkbox => {
            checkbox.checked = false;
        });
        updateActiveFilters();
    });

    // Add event listeners for all filter types
    document.querySelectorAll('.workgine-focus, .business-area, .website-purpose, .general-category, .country-filter, .tld-filter').forEach(checkbox => {
        checkbox.addEventListener('change', updateActiveFilters);
    });

    // Traffic filter listeners
    document.getElementById('minTraffic').addEventListener('input', updateActiveFilters);
    document.getElementById('maxTraffic').addEventListener('input', updateActiveFilters);
}

// Update Active Filters
function updateActiveFilters() {
    // Clear previous filters
    activeFilters = {
        workgineFocus: [],
        businessAreas: [],
        websitePurpose: [],
        generalCategories: [],
        countries: [],
        tlds: [],
        trafficMin: null,
        trafficMax: null
    };

    // Collect WorkGine Focus
    document.querySelectorAll('.workgine-focus:checked').forEach(checkbox => {
        activeFilters.workgineFocus.push(checkbox.value);
    });

    // Collect Business Areas
    document.querySelectorAll('.business-area:checked').forEach(checkbox => {
        activeFilters.businessAreas.push(checkbox.value);
    });

    // Collect Website Purpose
    document.querySelectorAll('.website-purpose:checked').forEach(checkbox => {
        activeFilters.websitePurpose.push(checkbox.value);
    });

    // Collect General Categories
    document.querySelectorAll('.general-category:checked').forEach(checkbox => {
        activeFilters.generalCategories.push(checkbox.value);
    });

    // Collect Countries
    document.querySelectorAll('.country-filter:checked').forEach(checkbox => {
        activeFilters.countries.push(checkbox.value);
    });

    // Collect TLDs
    document.querySelectorAll('.tld-filter:checked').forEach(checkbox => {
        activeFilters.tlds.push(checkbox.value);
    });

    // Collect Traffic Filters
    const minTraffic = document.getElementById('minTraffic').value;
    const maxTraffic = document.getElementById('maxTraffic').value;
    
    if (minTraffic) activeFilters.trafficMin = parseInt(minTraffic);
    if (maxTraffic) activeFilters.trafficMax = parseInt(maxTraffic);

    // Update active filter tags display
    displayActiveFilterTags();
    
    // Apply filters if data is loaded
    if (websiteData.length > 0) {
        applyEnhancedFilters();
    }
}

// Display Active Filter Tags
function displayActiveFilterTags() {
    const container = document.getElementById('activeFiltersContainer');
    const section = document.getElementById('activeFiltersSection');
    
    container.innerHTML = '';
    
    let hasActiveFilters = false;

    // Helper function to create filter tag
    function createFilterTag(label, type, value) {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            ${label}
            <button class="remove-filter" onclick="removeFilter('${type}', '${value}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        return tag;
    }

    // Add WorkGine Focus tags
    activeFilters.workgineFocus.forEach(filter => {
        const label = filter === 'software-saas' ? 'Software & SaaS' : filter;
        container.appendChild(createFilterTag(label, 'workgineFocus', filter));
        hasActiveFilters = true;
    });

    // Add Business Area tags
    activeFilters.businessAreas.forEach(filter => {
        const labels = {
            'digital-marketing': 'Digital Marketing & SEO',
            'business-finance': 'Business & Finance',
            'real-estate': 'Real Estate',
            'automotive': 'Automotive',
            'home-improvement': 'Home Improvement & Gardening'
        };
        container.appendChild(createFilterTag(labels[filter] || filter, 'businessAreas', filter));
        hasActiveFilters = true;
    });

    // Add Website Purpose tags
    activeFilters.websitePurpose.forEach(filter => {
        const labels = {
            'blog-guest': 'Blog / Guest Posting',
            'service-based': 'Service-Based',
            'ecommerce': 'E-commerce'
        };
        container.appendChild(createFilterTag(labels[filter] || filter, 'websitePurpose', filter));
        hasActiveFilters = true;
    });

    // Add General Category tags
    activeFilters.generalCategories.forEach(filter => {
        const label = filter.charAt(0).toUpperCase() + filter.slice(1);
        container.appendChild(createFilterTag(label, 'generalCategories', filter));
        hasActiveFilters = true;
    });

    // Add Country tags (limit to first 5 to avoid clutter)
    const countryLabels = activeFilters.countries.slice(0, 5);
    countryLabels.forEach(filter => {
        const label = filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ');
        container.appendChild(createFilterTag(label, 'countries', filter));
        hasActiveFilters = true;
    });
    
    if (activeFilters.countries.length > 5) {
        const moreTag = document.createElement('div');
        moreTag.className = 'filter-tag';
        moreTag.innerHTML = `+${activeFilters.countries.length - 5} more countries`;
        container.appendChild(moreTag);
    }

    // Add TLD tags (limit to first 5)
    const tldLabels = activeFilters.tlds.slice(0, 5);
    tldLabels.forEach(filter => {
        container.appendChild(createFilterTag(`.${filter}`, 'tlds', filter));
        hasActiveFilters = true;
    });
    
    if (activeFilters.tlds.length > 5) {
        const moreTag = document.createElement('div');
        moreTag.className = 'filter-tag';
        moreTag.innerHTML = `+${activeFilters.tlds.length - 5} more TLDs`;
        container.appendChild(moreTag);
    }

    // Add Traffic Range tags
    if (activeFilters.trafficMin || activeFilters.trafficMax) {
        let trafficLabel = 'Traffic: ';
        if (activeFilters.trafficMin && activeFilters.trafficMax) {
            trafficLabel += `${activeFilters.trafficMin.toLocaleString()} - ${activeFilters.trafficMax.toLocaleString()}`;
        } else if (activeFilters.trafficMin) {
            trafficLabel += `≥ ${activeFilters.trafficMin.toLocaleString()}`;
        } else {
            trafficLabel += `≤ ${activeFilters.trafficMax.toLocaleString()}`;
        }
        container.appendChild(createFilterTag(trafficLabel, 'traffic', 'range'));
        hasActiveFilters = true;
    }

    // Show/hide the active filters section
    section.style.display = hasActiveFilters ? 'block' : 'none';
}

// Remove Filter Function
function removeFilter(type, value) {
    if (type === 'traffic') {
        document.getElementById('minTraffic').value = '';
        document.getElementById('maxTraffic').value = '';
    } else {
        // Find and uncheck the corresponding checkbox
        let selector = '';
        switch(type) {
            case 'workgineFocus':
                selector = `.workgine-focus[value="${value}"]`;
                break;
            case 'businessAreas':
                selector = `.business-area[value="${value}"]`;
                break;
            case 'websitePurpose':
                selector = `.website-purpose[value="${value}"]`;
                break;
            case 'generalCategories':
                selector = `.general-category[value="${value}"]`;
                break;
            case 'countries':
                selector = `.country-filter[value="${value}"]`;
                break;
            case 'tlds':
                selector = `.tld-filter[value="${value}"]`;
                break;
        }
        
        const checkbox = document.querySelector(selector);
        if (checkbox) {
            checkbox.checked = false;
        }
    }
    
    updateActiveFilters();
}

// Enhanced Apply Filters Function
function applyEnhancedFilters() {
    if (!websiteData || websiteData.length === 0) return;

    let filteredData = [...websiteData];

    // Apply WorkGine Focus filter
    if (activeFilters.workgineFocus.length > 0) {
        filteredData = filteredData.filter(site => {
            return activeFilters.workgineFocus.some(focus => {
                if (focus === 'software-saas') {
                    return enhancedCategoryMappings['tech'].some(keyword => 
                        site.Domain.toLowerCase().includes(keyword) ||
                        (site.Categories && site.Categories.toLowerCase().includes(keyword))
                    );
                }
                return false;
            });
        });
    }

    // Apply Business Areas filter
    if (activeFilters.businessAreas.length > 0) {
        filteredData = filteredData.filter(site => {
            return activeFilters.businessAreas.some(area => {
                const keywords = enhancedCategoryMappings[area] || [];
                return keywords.some(keyword => 
                    site.Domain.toLowerCase().includes(keyword) ||
                    (site.Categories && site.Categories.toLowerCase().includes(keyword))
                );
            });
        });
    }

    // Apply Website Purpose filter
    if (activeFilters.websitePurpose.length > 0) {
        filteredData = filteredData.filter(site => {
            return activeFilters.websitePurpose.some(purpose => {
                const keywords = enhancedCategoryMappings[purpose] || [];
                return keywords.some(keyword => 
                    site.Domain.toLowerCase().includes(keyword) ||
                    (site.Categories && site.Categories.toLowerCase().includes(keyword))
                );
            });
        });
    }

    // Apply General Categories filter
    if (activeFilters.generalCategories.length > 0) {
        filteredData = filteredData.filter(site => {
            return activeFilters.generalCategories.some(category => {
                const keywords = enhancedCategoryMappings[category] || [];
                return keywords.some(keyword => 
                    site.Domain.toLowerCase().includes(keyword) ||
                    (site.Categories && site.Categories.toLowerCase().includes(keyword))
                );
            });
        });
    }

    // Apply Country filter
    if (activeFilters.countries.length > 0) {
        filteredData = filteredData.filter(site => {
            const domain = site.Domain.toLowerCase();
            return activeFilters.countries.some(country => {
                // Map country names to domain patterns
                const countryMappings = {
                    'usa': ['.com', 'us'],
                    'uk': ['.uk', '.co.uk'],
                    'canada': ['.ca'],
                    'australia': ['.au', '.com.au'],
                    'germany': ['.de'],
                    'france': ['.fr'],
                    'india': ['.in'],
                    'japan': ['.jp', '.co.jp'],
                    'china': ['.cn', '.com.cn'],
                    'brazil': ['.br', '.com.br'],
                    'other': true // Always matches for 'other'
                };
                
                if (country === 'other') return true;
                const patterns = countryMappings[country] || [];
                return patterns.some(pattern => domain.includes(pattern));
            });
        });
    }

    // Apply TLD filter
    if (activeFilters.tlds.length > 0) {
        filteredData = filteredData.filter(site => {
            const domain = site.Domain.toLowerCase();
            return activeFilters.tlds.some(tld => {
                if (tld === 'other-tlds') return true; // Always matches for 'other'
                return domain.endsWith(`.${tld}`);
            });
        });
    }

    // Apply Traffic filter
    if (activeFilters.trafficMin || activeFilters.trafficMax) {
        filteredData = filteredData.filter(site => {
            const traffic = parseInt(site['Organic Traffic']) || 0;
            let matches = true;
            
            if (activeFilters.trafficMin) {
                matches = matches && traffic >= activeFilters.trafficMin;
            }
            
            if (activeFilters.trafficMax) {
                matches = matches && traffic <= activeFilters.trafficMax;
            }
            
            return matches;
        });
    }

    // Update filtered data and display
    filteredWebsiteData = filteredData;
    displayResults(filteredData);
    updateCategorySummaryEnhanced(filteredData);
}

// Enhanced Category Summary
function updateCategorySummaryEnhanced(data) {
    const container = document.getElementById('summaryTagsEnhanced');
    const section = document.getElementById('categorySummaryEnhanced');
    
    if (!data || data.length === 0) {
        section.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    
    // Count categories
    const categoryCounts = {};
    
    data.forEach(site => {
        // Check each category mapping
        Object.keys(enhancedCategoryMappings).forEach(category => {
            const keywords = enhancedCategoryMappings[category];
            const hasCategory = keywords.some(keyword => 
                site.Domain.toLowerCase().includes(keyword) ||
                (site.Categories && site.Categories.toLowerCase().includes(keyword))
            );
            
            if (hasCategory) {
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            }
        });
    });

    // Sort by count and create tags
    const sortedCategories = Object.entries(categoryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10); // Show top 10 categories

    sortedCategories.forEach(([category, count]) => {
        const tag = document.createElement('div');
        tag.className = 'summary-tag-enhanced';
        
        const categoryLabels = {
            'tech': 'tech',
            'fashion': 'fashion',
            'business': 'business',
            'ecommerce': 'ecommerce',
            'lifestyle': 'lifestyle',
            'sports': 'sports',
            'health': 'health',
            'photography': 'photography',
            'education': 'education',
            'food': 'food',
            'travel': 'travel',
            'finance': 'finance'
        };
        
        const label = categoryLabels[category] || category;
        tag.innerHTML = `${label}<span class="count">${count}</span>`;
        
        // Add click functionality to filter by this category
        tag.addEventListener('click', () => {
            // Clear other general category filters and select this one
            document.querySelectorAll('.general-category').forEach(cb => cb.checked = false);
            const checkbox = document.querySelector(`.general-category[value="${category}"]`);
            if (checkbox) {
                checkbox.checked = true;
                updateActiveFilters();
            }
        });
        
        container.appendChild(tag);
    });

    section.style.display = 'block';
}

// Update the main initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    initializeEnhancedFilters();
    initializeAnalytics();
    
    // Initialize file upload
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.querySelector('.upload-area');
    
    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', () => fileInput.click());
});

