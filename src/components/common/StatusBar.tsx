import React from 'react';
import { Wifi, WifiOff, Bell } from 'lucide-react';

interface StatusBarProps {
    isOnline: boolean;
    appVersion: string;
    notificationSupported: boolean;
    notificationStatus: NotificationPermission | 'requesting';
    deviceToken: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
    isOnline,
    appVersion,
    notificationSupported,
    notificationStatus,
    deviceToken,
}) => {
    return (
        <div className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur p-2 flex flex-col gap-2 z-10">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <Wifi className="w-4 h-4 text-green-400" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
                    <span className="text-xs text-gray-400 ml-2">v{appVersion}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${notificationSupported ? 'text-green-400' : 'text-red-400'}`} />
                    <span className="text-sm">{notificationSupported ? notificationStatus : 'Not Supported'}</span>
                </div>
            </div>

            {deviceToken && (
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
                    <input
                        type="text"
                        value={deviceToken}
                        readOnly
                        className="flex-1 bg-transparent text-xs overflow-hidden text-ellipsis"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(deviceToken);
                            alert('Token copied to clipboard!');
                        }}
                        className="px-2 py-1 bg-purple-600 text-xs rounded hover:bg-purple-700 transition-colors"
                    >
                        Copy Token
                    </button>
                </div>
            )}
        </div>
    );
};

export default StatusBar;
