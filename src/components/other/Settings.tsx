import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore'; // Import Zustand store
import './Settings.css'; // Ensure the CSS file is imported

interface SettingsProps {
    isOpen: any;
    onClose: any;
    onUpdate: any;
}

const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onUpdate }) => {
    const { dapps } = useStore((state: any) => state); // Access dapps from Zustand store
    const [receiverAddress, setReceiverAddress] = useState<any>('');
    const [slippage, setSlippage] = useState<any>('1');
    const [searchTerm, setSearchTerm] = useState<any>('');
    const [dApps, setDApps] = useState<any[]>([]);
    const [toggledDApps, setToggledDApps] = useState<any[]>([]);

    useEffect(() => {
        if (dapps) {
            const dAppsArray = Object.keys(dapps).map((key, index) => ({
                id: index + 1, // Use index as ID for simplicity
                label: key, // Use the main dApp label
                name: dapps[key].name,
                imageURI: dapps[key].imageURI,
                toggled: true, // Initialize as toggled on
            }));
            setDApps(dAppsArray);
            setToggledDApps(dAppsArray.map((dApp: any) => dApp.label)); // Initialize all labels as toggled on
        }
    }, [dapps]);

    useEffect(() => {
        // Call onUpdate to pass the current state up to the parent component
        onUpdate({
            receiverAddress,
            slippage,
            dApps: toggledDApps
        });
    }, [receiverAddress, slippage, toggledDApps, onUpdate]);

    const toggleDApp = (id: any) => {
        const updatedDApps = dApps.map((dApp: any) => {
            if (dApp.id === id) {
                const newToggledState = !dApp.toggled;
                if (newToggledState) {
                    setToggledDApps((prev: any) => [...prev, dApp.label]);
                } else {
                    setToggledDApps((prev: any) => prev.filter((label: any) => label !== dApp.label));
                }
                return { ...dApp, toggled: newToggledState };
            }
            return dApp;
        });
        setDApps(updatedDApps);
    };

    const toggleAllDApps = () => {
        const allOn = dApps.every((dApp: any) => dApp.toggled);
        const updatedDApps = dApps.map((dApp: any) => ({ ...dApp, toggled: !allOn }));
        setDApps(updatedDApps);
        setToggledDApps(allOn ? [] : updatedDApps.map((dApp: any) => dApp.label));
    };

    const filteredDApps = dApps.filter((dApp: any) => dApp.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!isOpen) return null;

    return (
        <div className="settings-settings-popup">
            <div className="settings-settings-content">
                <input
                    type="text"
                    placeholder="Receiver's address (if available for dapp)"
                    className="settings-big-input"
                    value={receiverAddress}
                    onChange={(e: any) => setReceiverAddress(e.target.value)}
                />
                <div className="settings-slippage-container">
                    <span>Slippage (0.5 for 0.5% slippage):</span>
                    <input
                        type="number"
                        className="settings-slippage-input"
                        value={slippage}
                        onChange={(e: any) => setSlippage(e.target.value)}
                        min="0"
                        step="0.1"
                    />
                </div>
                <div className="settings-dapp-controls">
                    <input
                        type="text"
                        placeholder="Search DApp..."
                        className="settings-search-input"
                        value={searchTerm}
                        onChange={(e: any) => setSearchTerm(e.target.value)}
                    />
                    <button onClick={toggleAllDApps} className="settings-toggle-all-button">Toggle All</button>
                </div>
                <div className="settings-dapp-list">
                    {filteredDApps.map((dApp: any) => (
                        <div key={dApp.id} className="settings-dapp-entry">
                            <img src={dApp.imageURI} alt={dApp.name} className="settings-dapp-image" />
                            <div className="settings-dapp-info">
                                <span className="settings-dapp-name">{dApp.name}</span>
                                <label className="settings-toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={dApp.toggled}
                                        onChange={() => toggleDApp(dApp.id)}
                                    />
                                    <span className="settings-toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={onClose} className="settings-save-close-button">Save and Close</button>
            </div>
        </div>
    );
};

export default Settings;
