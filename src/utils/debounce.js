/**
 * Debounce utility for Brighton Gigs
 * 
 * Prevents excessive function calls by ensuring the function is only executed
 * after a specified delay has passed since the last invocation.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds (default: 300ms)
 * @param {Object} options - Configuration options
 * @param {boolean} options.leading - Execute on leading edge (default: false)
 * @param {boolean} options.trailing - Execute on trailing edge (default: true)
 * @returns {Function} The debounced function
 */
export const debounce = (func, delay = 300, options = {}) => {
    const { leading = false, trailing = true } = options;
    let timeoutId = null;
    let lastCallTime = 0;
    let lastArgs = null;
    
    // Validation
    if (typeof func !== 'function') {
        throw new Error('debounce: First argument must be a function');
    }
    
    if (typeof delay !== 'number' || delay < 0) {
        throw new Error('debounce: Delay must be a non-negative number');
    }
    
    const debouncedFunction = function(...args) {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        lastArgs = args;
        
        // Clear existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        
        // Execute immediately if leading edge and enough time has passed
        if (leading && timeSinceLastCall >= delay) {
            lastCallTime = now;
            return func.apply(this, args);
        }
        
        // Set up trailing edge execution
        if (trailing) {
            timeoutId = setTimeout(() => {
                lastCallTime = Date.now();
                timeoutId = null;
                func.apply(this, lastArgs);
            }, delay);
        }
    };
    
    // Add cancel method to stop pending executions
    debouncedFunction.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastCallTime = 0;
        lastArgs = null;
    };
    
    // Add flush method to execute immediately
    debouncedFunction.flush = function() {
        if (timeoutId && lastArgs) {
            clearTimeout(timeoutId);
            timeoutId = null;
            const result = func.apply(this, lastArgs);
            lastCallTime = Date.now();
            return result;
        }
    };
    
    // Add pending method to check if execution is pending
    debouncedFunction.pending = () => timeoutId !== null;
    
    return debouncedFunction;
};

/**
 * Creates a debounced version of a function optimized for filter operations
 * Includes performance monitoring and automatic adjustment
 */
export const createFilterDebouncer = (filterFunction, initialDelay = 300) => {
    let performanceHistory = [];
    let currentDelay = initialDelay;
    
    const trackPerformance = (startTime) => {
        const executionTime = performance.now() - startTime;
        performanceHistory.push(executionTime);
        
        // Keep only recent history (last 10 executions)
        if (performanceHistory.length > 10) {
            performanceHistory = performanceHistory.slice(-10);
        }
        
        // Adjust delay based on average execution time
        const avgTime = performanceHistory.reduce((a, b) => a + b, 0) / performanceHistory.length;
        
        if (avgTime > 100) {
            // Slow operations need more debouncing
            currentDelay = Math.max(initialDelay, Math.min(500, avgTime * 2));
        } else if (avgTime < 20) {
            // Fast operations can be less debounced
            currentDelay = Math.max(100, initialDelay * 0.8);
        }
    };
    
    const wrappedFilter = (...args) => {
        const startTime = performance.now();
        const result = filterFunction(...args);
        trackPerformance(startTime);
        return result;
    };
    
    return debounce(wrappedFilter, currentDelay, { trailing: true });
};