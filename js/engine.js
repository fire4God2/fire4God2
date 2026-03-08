/**
 * Lotto Generator Engine (engine.js)
 * Handles number generation algorithms and filtering pipelines.
 * Designed for scalability to easily add new generation/filter strategies.
 */

class LottoFilter {
    /**
     * @param {number[]} numbers - Array of 6 generated lotto numbers (1-45, sorted)
     * @param {Object} options - Filter criteria
     */
    static isValid(numbers, options) {
        if (!numbers || numbers.length !== 6) return false;

        if (!this._checkIncludeExclude(numbers, options.include, options.exclude)) return false;
        if (!this._checkSumRange(numbers, options.sumRange)) return false;
        if (!this._checkOddEven(numbers, options.oddEvenRatio)) return false;
        if (!this._checkColorBalance(numbers, options.maxSameColor)) return false;
        if (!this._checkAcValue(numbers, options.minAcValue)) return false;

        return true;
    }

    static _checkIncludeExclude(numbers, include = [], exclude = []) {
        for (const inc of include) {
            if (!numbers.includes(inc)) return false;
        }
        for (const exc of exclude) {
            if (numbers.includes(exc)) return false;
        }
        return true;
    }

    static _checkSumRange(numbers, range) {
        if (!range) return true;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return sum >= range.min && sum <= range.max;
    }

    static _checkOddEven(numbers, targetRatio) {
        if (!targetRatio) return true; 
        let oddCount = 0;
        let evenCount = 0;
        numbers.forEach(n => n % 2 !== 0 ? oddCount++ : evenCount++);
        
        if (Array.isArray(targetRatio)) {
           return targetRatio.some(r => r.odd === oddCount && r.even === evenCount);
        }
        return oddCount === targetRatio.odd && evenCount === targetRatio.even;
    }

    static _checkColorBalance(numbers, maxSameColor) {
        if (!maxSameColor) return true;
        
        // Colors: 1-10(Yellow), 11-20(Blue), 21-30(Red), 31-40(Gray), 41-45(Green)
        const colorCounts = [0, 0, 0, 0, 0];
        numbers.forEach(n => {
            if (n <= 10) colorCounts[0]++;
            else if (n <= 20) colorCounts[1]++;
            else if (n <= 30) colorCounts[2]++;
            else if (n <= 40) colorCounts[3]++;
            else colorCounts[4]++;
        });

        return Math.max(...colorCounts) <= maxSameColor;
    }

    // AC (Arithmetic Complexity) Value Calculation
    static _checkAcValue(numbers, minAcValue = 7) {
        const diffs = new Set();
        for (let i = 0; i < numbers.length - 1; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                diffs.add(Math.abs(numbers[i] - numbers[j]));
            }
        }
        const acValue = diffs.size - 5;
        return acValue >= minAcValue;
    }
}


class GeneratorStrategies {
    static randomSequence() {
        const pool = Array.from({ length: 45 }, (_, i) => i + 1);
        const result = [];
        for (let i = 0; i < 6; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            result.push(pool[idx]);
            pool.splice(idx, 1);
        }
        return result.sort((a, b) => a - b);
    }

    static statisticalSequence(hotNumbers = [], coldNumbers = []) {
        // [TO-DO for Phase 2] Implement weighted random logic using actual API data
        // Currently acts as a proxy to random
        return this.randomSequence(); 
    }
    
    // Pseudo-random generation based on dynamic seed (e.g. birthdate + iteration)
    static metaphysicalSequence(seedString) {
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            const char = seedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        
        let seed = Math.abs(hash);
        const lcgRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        const result = [];
        while (result.length < 6) {
             const num = Math.floor(lcgRandom() * 45) + 1;
             if (!result.includes(num)) result.push(num);
        }
        return result.sort((a, b) => a - b);
    }
}

export class LottoEngine {
    constructor(defaultOptions = {}) {
        this.options = {
            include: [],
            exclude: [],
            sumRange: { min: 100, max: 170 },
            oddEvenRatio: [{ odd: 3, even: 3 }, { odd: 2, even: 4 }, { odd: 4, even: 2 }], 
            maxSameColor: 3,
            minAcValue: 7,
            ...defaultOptions
        };
    }

    /**
     * @param {string} strategy - 'random', 'statistical', 'metaphysical'
     * @param {Object} strategyArgs - Extra arguments
     * @returns {number[]} Array of 6 sorted numbers
     */
    generate(strategy = 'random', strategyArgs = {}) {
        const MAX_ITERATIONS = 50000; // Guard against intractable constraints
        let iterations = 0;
        
        while (iterations < MAX_ITERATIONS) {
            let candidate;
            switch(strategy) {
                case 'metaphysical':
                    candidate = GeneratorStrategies.metaphysicalSequence((strategyArgs.seed || "DEFAULT") + iterations.toString());
                    break;
                case 'statistical':
                    candidate = GeneratorStrategies.statisticalSequence(strategyArgs.hot, strategyArgs.cold);
                    break;
                case 'random':
                default:
                    candidate = GeneratorStrategies.randomSequence();
            }

            if (LottoFilter.isValid(candidate, this.options)) {
                return candidate;
            }
            iterations++;
        }

        throw new Error("Constraints are too strict. Unable to generate a matching sequence.");
    }

    generateMultiple(count, strategy = 'random', strategyArgs = {}) {
        const results = [];
        for (let i = 0; i < count; i++) {
            results.push(this.generate(strategy, strategyArgs));
        }
        return results;
    }
}
