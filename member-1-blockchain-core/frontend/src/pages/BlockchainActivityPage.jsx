import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { blockchainService } from '../services/blockchain';
import CertificateRegistryABI from '../contracts/CertificateRegistry.json';

export default function BlockchainActivityPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let certReg;
    let instReg;

    const setupListeners = async () => {
      if (!blockchainService.provider) return;

      instReg = blockchainService.institutionRegistry;
      
      // Fetch CertificateRegistry address from DigitalCredential
      const certRegAddress = await blockchainService.digitalCredential.certificateRegistry();
      certReg = new ethers.Contract(certRegAddress, CertificateRegistryABI.abi, blockchainService.provider);

      // Institution Events
      instReg.on("InstitutionRegistered", (instId, name, event) => {
        setEvents(prev => [...prev, { type: "InstitutionRegistered", instId, txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });
      instReg.on("InstitutionDeactivated", (instId, event) => {
        setEvents(prev => [...prev, { type: "InstitutionDeactivated", instId, txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });
      instReg.on("IssuerAuthorized", (instId, issuer, event) => {
        setEvents(prev => [...prev, { type: "IssuerAuthorized", instId, address: issuer, txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });
      instReg.on("IssuerRevoked", (instId, issuer, event) => {
        setEvents(prev => [...prev, { type: "IssuerRevoked", instId, address: issuer, txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });

      // Certificate Events
      certReg.on("CertificateIssued", (certId, hash, issuer, expiry, version, event) => {
        setEvents(prev => [...prev, { type: "CertificateIssued", certId, address: issuer, txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });
      certReg.on("CertificateRevoked", (certId, event) => {
        setEvents(prev => [...prev, { type: "CertificateRevoked", certId, txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });
      certReg.on("CertificateVersionCreated", (certId, newHash, newExpiry, newVersion, event) => {
        setEvents(prev => [...prev, { type: "CertificateVersionCreated", certId, version: newVersion.toString(), txHash: event.log.transactionHash, blockNumber: event.log.blockNumber }]);
      });
    };
    
    setupListeners();
    
    return () => {
        if (certReg) certReg.removeAllListeners();
        if (instReg) instReg.removeAllListeners();
    };
  }, []);

  return (
    <div className="page-container">
      <h2>Live Blockchain Activity</h2>
      <div className="card">
        {events.length === 0 ? <p>Listening for new events...</p> : (
          <ul className="event-list">
            {events.map((e, idx) => (
              <li key={idx}>
                <strong>{e.type}</strong> - <small>Block: {e.blockNumber}</small><br/>
                <small>TX: {e.txHash}</small><br/>
                {e.certId && <span>Cert: {e.certId} </span>}
                {e.instId && <span>Inst: {e.instId} </span>}
                {e.address && <span>Addr: {e.address} </span>}
                {e.version && <span>Version: {e.version} </span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
