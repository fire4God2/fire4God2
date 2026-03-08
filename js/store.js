/**
 * Data Store & Sync Manager (store.js)
 * Handles persistence of generated lotto numbers and official winning numbers
 */

const STORAGE_KEYS = {
    MY_NUMBERS: 'lotto_my_numbers',
    OFFICIAL_RESULTS: 'lotto_official_results'
};

export class SyncManager {
    static getOfficialResults() {
        const data = localStorage.getItem(STORAGE_KEYS.OFFICIAL_RESULTS);
        return data ? JSON.parse(data) : {};
    }

    static saveOfficialResults(results) {
        localStorage.setItem(STORAGE_KEYS.OFFICIAL_RESULTS, JSON.stringify(results));
    }

    static async fetchLatestDraw(drawNo) {
        // [TO-DO for Phase 2]
        // Implementation for scraping/calling proxy for 동행복권 API to bypass CORS
        return null;
    }
}

export class MyNumberStore {
    /**
     * @returns {Array} [{ id: string, name: string, numbers: number[][], date: string, drawNo: number|null }]
     */
    static getSavedNumbers() {
        const data = localStorage.getItem(STORAGE_KEYS.MY_NUMBERS);
        return data ? JSON.parse(data) : [];
    }

    static saveNumbers(name, numberSets, targetDrawNo = null) {
        const currentList = this.getSavedNumbers();

        const newEntry = {
            id: crypto.randomUUID(),
            name: name || '생성된 번호',
            numbers: numberSets,
            // Uses local timestamp format for easy display
            date: new Date().toISOString(),
            drawNo: targetDrawNo
        };

        currentList.unshift(newEntry);
        localStorage.setItem(STORAGE_KEYS.MY_NUMBERS, JSON.stringify(currentList));
        return newEntry;
    }

    static deleteEntry(id) {
        let currentList = this.getSavedNumbers();
        currentList = currentList.filter(entry => entry.id !== id);
        localStorage.setItem(STORAGE_KEYS.MY_NUMBERS, JSON.stringify(currentList));
    }

    /**
     * Checks sequence against official results 
     * @returns {number} Prize Rank (1-5, or 0 for none)
     */
    static checkWinning(myNumbers, officialNumbers, bonusNumber) {
        const matchCount = myNumbers.filter(n => officialNumbers.includes(n)).length;
        const hasBonus = myNumbers.includes(bonusNumber);

        if (matchCount === 6) return 1;
        if (matchCount === 5 && hasBonus) return 2;
        if (matchCount === 5) return 3;
        if (matchCount === 4) return 4;
        if (matchCount === 3) return 5;
        return 0; // No prize
    }
}
