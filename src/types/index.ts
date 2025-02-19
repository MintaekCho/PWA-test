export type TestResult = {
    tested: boolean;
    success: boolean;
    details: string;
};

export type TestResults = {
    pdf: TestResult;
    signature: TestResult;
    phone: TestResult;
    fileIO: TestResult;
    location: TestResult;
    photo: TestResult;
};

export type UserLocation = {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
};

export type TestComponentProps = {
    onClose: () => void;
    testResult: TestResult;
    updateTestResult: (newResult: TestResult) => void;
};
