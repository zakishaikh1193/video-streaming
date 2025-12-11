import { useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader, RefreshCw, Copy, Info, QrCode } from 'lucide-react';
import api from '../services/api';
import { getBackendBaseUrl, getApiBaseUrl } from '../utils/apiConfig';

function QRCodeDiagnostic({ onClose }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);

  const runDiagnostics = async () => {
    setRunning(true);
    setResults(null);
    setCopied(false);
    
    const diagnosticResults = {
      timestamp: new Date().toISOString(),
      checks: [],
      errors: [],
      warnings: []
    };

    try {
      // Check 1: Backend API connectivity
      try {
        const apiBaseUrl = getApiBaseUrl();
        const healthCheck = await fetch(`${apiBaseUrl}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        diagnosticResults.checks.push({
          name: 'Backend API Connectivity',
          status: healthCheck.ok ? 'success' : 'error',
          message: healthCheck.ok 
            ? 'Backend server is reachable' 
            : `Backend returned status ${healthCheck.status}`,
          details: {
            status: healthCheck.status,
            statusText: healthCheck.statusText,
            url: `${apiBaseUrl}/health`
          }
        });
        if (!healthCheck.ok) {
          diagnosticResults.errors.push('Backend server is not reachable');
        }
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'Backend API Connectivity',
          status: 'error',
          message: 'Cannot reach backend server',
          details: {
            error: err.message,
            suggestion: 'Check if backend server is running on port 5000',
            url: getApiBaseUrl()
          }
        });
        diagnosticResults.errors.push('Cannot reach backend server');
      }

      // Check 2: Authentication token
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          diagnosticResults.checks.push({
            name: 'Authentication Token',
            status: 'error',
            message: 'No authentication token found',
            details: {
              suggestion: 'Please log in to access QR codes'
            }
          });
          diagnosticResults.errors.push('Authentication token missing');
        } else {
          diagnosticResults.checks.push({
            name: 'Authentication Token',
            status: 'success',
            message: 'Authentication token found',
            details: {
              tokenLength: token.length,
              tokenPrefix: token.substring(0, 20) + '...'
            }
          });
        }
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'Authentication Token',
          status: 'error',
          message: 'Error checking authentication token',
          details: {
            error: err.message
          }
        });
        diagnosticResults.errors.push('Error checking authentication');
      }

      // Check 3: QR Codes API endpoint
      try {
        const qrResponse = await api.get('/videos/qr-codes');
        const qrCodes = qrResponse.data;
        
        diagnosticResults.checks.push({
          name: 'QR Codes API Endpoint',
          status: 'success',
          message: `Successfully fetched ${qrCodes.length} QR codes`,
          details: {
            count: qrCodes.length,
            endpoint: '/videos/qr-codes',
            status: qrResponse.status
          }
        });

        // Check 4: QR Codes data structure
        if (qrCodes.length > 0) {
          const firstQR = qrCodes[0];
          const requiredFields = ['videoId', 'shortUrl'];
          const missingFields = requiredFields.filter(field => !firstQR[field]);
          
          if (missingFields.length === 0) {
            diagnosticResults.checks.push({
              name: 'QR Codes Data Structure',
              status: 'success',
              message: 'QR codes have required fields',
              details: {
                sampleVideoId: firstQR.videoId,
                sampleShortUrl: firstQR.shortUrl,
                hasTitle: !!firstQR.title,
                hasCourse: !!firstQR.course,
                hasGrade: !!firstQR.grade
              }
            });
          } else {
            diagnosticResults.checks.push({
              name: 'QR Codes Data Structure',
              status: 'warning',
              message: `Some QR codes missing fields: ${missingFields.join(', ')}`,
              details: {
                missingFields: missingFields,
                sampleData: firstQR
              }
            });
            diagnosticResults.warnings.push(`Missing fields: ${missingFields.join(', ')}`);
          }

          // Check 5: QR Code file existence (sample check)
          if (firstQR.videoId) {
            try {
              const downloadResponse = await api.get(`/videos/${firstQR.videoId}/qr-download`, {
                responseType: 'blob',
                timeout: 10000
              });
              
              if (downloadResponse.data && downloadResponse.data.size > 0) {
                diagnosticResults.checks.push({
                  name: 'QR Code File Download',
                  status: 'success',
                  message: 'QR code files can be downloaded',
                  details: {
                    sampleVideoId: firstQR.videoId,
                    fileSize: `${(downloadResponse.data.size / 1024).toFixed(2)} KB`,
                    contentType: downloadResponse.headers['content-type']
                  }
                });
              } else {
                diagnosticResults.checks.push({
                  name: 'QR Code File Download',
                  status: 'warning',
                  message: 'QR code download returned empty file',
                  details: {
                    sampleVideoId: firstQR.videoId
                  }
                });
                diagnosticResults.warnings.push('Some QR code files may be empty');
              }
            } catch (downloadErr) {
              if (downloadErr.response?.status === 404) {
                diagnosticResults.checks.push({
                  name: 'QR Code File Download',
                  status: 'warning',
                  message: 'QR code file not found (will be generated on demand)',
                  details: {
                    sampleVideoId: firstQR.videoId,
                    error: downloadErr.response?.data?.error || downloadErr.message,
                    note: 'QR codes are generated automatically when needed'
                  }
                });
                diagnosticResults.warnings.push('Some QR code files may need to be generated');
              } else {
                diagnosticResults.checks.push({
                  name: 'QR Code File Download',
                  status: 'error',
                  message: 'Failed to download QR code file',
                  details: {
                    sampleVideoId: firstQR.videoId,
                    error: downloadErr.response?.data?.error || downloadErr.message,
                    status: downloadErr.response?.status
                  }
                });
                diagnosticResults.errors.push('QR code download failed');
              }
            }
          }
        } else {
          diagnosticResults.checks.push({
            name: 'QR Codes Data',
            status: 'info',
            message: 'No QR codes found in database',
            details: {
              note: 'This is normal if no videos have been uploaded yet',
              suggestion: 'Upload videos to generate QR codes'
            }
          });
        }
      } catch (err) {
        const status = err.response?.status;
        const errorMessage = err.response?.data?.error || err.message;
        
        if (status === 401) {
          diagnosticResults.checks.push({
            name: 'QR Codes API Endpoint',
            status: 'error',
            message: 'Authentication failed - please log in',
            details: {
              status: 401,
              error: errorMessage,
              suggestion: 'Your session may have expired. Please log in again.'
            }
          });
          diagnosticResults.errors.push('Authentication failed');
        } else if (status === 403) {
          diagnosticResults.checks.push({
            name: 'QR Codes API Endpoint',
            status: 'error',
            message: 'Access forbidden - insufficient permissions',
            details: {
              status: 403,
              error: errorMessage
            }
          });
          diagnosticResults.errors.push('Access forbidden');
        } else if (status === 404) {
          diagnosticResults.checks.push({
            name: 'QR Codes API Endpoint',
            status: 'error',
            message: 'QR codes endpoint not found',
            details: {
              status: 404,
              error: errorMessage,
              endpoint: '/videos/qr-codes',
              suggestion: 'Check if the backend route is properly configured'
            }
          });
          diagnosticResults.errors.push('QR codes endpoint not found');
        } else {
          diagnosticResults.checks.push({
            name: 'QR Codes API Endpoint',
            status: 'error',
            message: 'Failed to fetch QR codes',
            details: {
              status: status || 'Network Error',
              error: errorMessage,
              endpoint: '/videos/qr-codes'
            }
          });
          diagnosticResults.errors.push(`Failed to fetch QR codes: ${errorMessage}`);
        }
      }

      // Check 6: qrcode.react library
      try {
        // Check if QRCodeSVG is available
        const { QRCodeSVG } = await import('qrcode.react');
        if (QRCodeSVG) {
          diagnosticResults.checks.push({
            name: 'QR Code Library',
            status: 'success',
            message: 'qrcode.react library is available',
            details: {
              library: 'qrcode.react',
              component: 'QRCodeSVG'
            }
          });
        }
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'QR Code Library',
          status: 'error',
          message: 'qrcode.react library not found',
          details: {
            error: err.message,
            suggestion: 'Run: npm install qrcode.react'
          }
        });
        diagnosticResults.errors.push('QR code library missing');
      }

      // Check 7: Browser clipboard API
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          diagnosticResults.checks.push({
            name: 'Browser Clipboard API',
            status: 'success',
            message: 'Browser supports clipboard API',
            details: {}
          });
        } else {
          diagnosticResults.checks.push({
            name: 'Browser Clipboard API',
            status: 'warning',
            message: 'Browser clipboard API not available',
            details: {
              suggestion: 'Copy functionality may not work in this browser'
            }
          });
          diagnosticResults.warnings.push('Clipboard API not available');
        }
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'Browser Clipboard API',
          status: 'warning',
          message: 'Could not check clipboard API',
          details: {
            error: err.message
          }
        });
      }

      // Check 8: Network connectivity
      try {
        const networkCheck = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        diagnosticResults.checks.push({
          name: 'Internet Connectivity',
          status: 'success',
          message: 'Internet connection is active',
          details: {}
        });
      } catch (err) {
        diagnosticResults.checks.push({
          name: 'Internet Connectivity',
          status: 'warning',
          message: 'Could not verify internet connectivity',
          details: {
            note: 'This may not affect local QR code functionality'
          }
        });
        diagnosticResults.warnings.push('Internet connectivity check failed');
      }

    } catch (err) {
      diagnosticResults.checks.push({
        name: 'Diagnostic Error',
        status: 'error',
        message: 'Error running diagnostics',
        details: {
          error: err.message,
          stack: err.stack
        }
      });
      diagnosticResults.errors.push(`Diagnostic error: ${err.message}`);
    }

    setResults(diagnosticResults);
    setRunning(false);
  };

  const copyDiagnostics = () => {
    const diagnosticText = JSON.stringify(results, null, 2);
    navigator.clipboard.writeText(diagnosticText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="w-6 h-6" />
            <h2 className="text-xl font-bold">QR Code Diagnostic Tool</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!results && !running && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                This diagnostic tool will check:
              </p>
              <ul className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                <li>• Backend API connectivity</li>
                <li>• Authentication token</li>
                <li>• QR Codes API endpoint</li>
                <li>• QR Codes data structure</li>
                <li>• QR Code file download capability</li>
                <li>• QR Code library availability</li>
                <li>• Browser clipboard API</li>
                <li>• Network connectivity</li>
              </ul>
              <button
                onClick={runDiagnostics}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors flex items-center gap-2 mx-auto shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Run Diagnostics
              </button>
            </div>
          )}

          {running && (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Running diagnostics...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Diagnostic Results</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(results.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyDiagnostics}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={runDiagnostics}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-run
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {results.checks.map((check, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      check.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : check.status === 'error'
                        ? 'border-red-200 bg-red-50'
                        : check.status === 'warning'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {check.name}
                        </h4>
                        <p className="text-sm text-gray-700 mb-2">
                          {check.message}
                        </p>
                        {check.details && Object.keys(check.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              Show details
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-600 font-semibold">
                      {results.checks.filter(c => c.status === 'success').length} Passed
                    </span>
                  </div>
                  <div>
                    <span className="text-yellow-600 font-semibold">
                      {results.checks.filter(c => c.status === 'warning').length} Warnings
                    </span>
                  </div>
                  <div>
                    <span className="text-red-600 font-semibold">
                      {results.checks.filter(c => c.status === 'error').length} Failed
                    </span>
                  </div>
                </div>
                {results.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <h5 className="font-semibold text-red-800 mb-1">Errors:</h5>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {results.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.warnings.length > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h5 className="font-semibold text-yellow-800 mb-1">Warnings:</h5>
                    <ul className="text-sm text-yellow-700 list-disc list-inside">
                      {results.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRCodeDiagnostic;

