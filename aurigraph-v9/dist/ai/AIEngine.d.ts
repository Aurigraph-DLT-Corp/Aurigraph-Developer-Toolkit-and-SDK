import { AssetCategory } from '../tokenization/types';
export declare class AIEngine {
    private logger;
    constructor();
    initialize(): Promise<void>;
    getModelsForCategory(category: AssetCategory): Promise<any[]>;
    deployModel(model: any): Promise<any>;
    generatePredictions(models: any[], historicalData: any[]): Promise<any[]>;
    stop(): Promise<void>;
}
//# sourceMappingURL=AIEngine.d.ts.map