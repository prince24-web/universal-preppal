'use client'
import React, { useState, useRef } from 'react';
import { Upload, FileText, Brain, BookOpen, Zap, X, Check, ArrowRight, Download} from 'lucide-react'

const PDFUploadPage = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  const generationOptions = [
    {
      id: 'summary',
      title: 'Smart Summary',
      description: 'Get concise, AI-powered summaries of key concepts',
      icon: <FileText className="w-6 h-6" />,
      color: 'blue',
      time: '~2 minutes'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Generate interactive flashcards for active recall',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'purple',
      time: '~3 minutes'
    },
    {
      id: 'quiz',
      title: 'Practice Quiz',
      description: 'Create quizzes to test your understanding',
      icon: <Brain className="w-6 h-6" />,
      color: 'pink',
      time: '~4 minutes'
    }
  ];

  const processingSteps = [
    'Analyzing PDF structure...',
    'Extracting text content...',
    'Processing with AI...',
    'Generating study materials...',
    'Almost done!'
  ];

  const handleFileSelect = (file) => {
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      setResults(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const toggleOption = (optionId) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleGenerate = async () => {
    if (!uploadedFile || selectedOptions.length === 0) return;

    setIsProcessing(true);
    setProcessingStep(0);

    // Simulate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessingStep(i);
    }

    // Simulate results
    const mockResults = {
      summary: selectedOptions.includes('summary') ? {
        title: 'Document Summary',
        content: 'This document covers key concepts in machine learning, including supervised and unsupervised learning algorithms, neural networks, and practical applications in real-world scenarios.'
      } : null,
      flashcards: selectedOptions.includes('flashcards') ? {
        count: 12,
        cards: [
          { front: 'What is supervised learning?', back: 'A type of machine learning where the algorithm learns from labeled training data.' },
          { front: 'Define neural network', back: 'A computational model inspired by biological neural networks...' }
        ]
      } : null,
      quiz: selectedOptions.includes('quiz') ? {
        questions: 8,
        topics: ['Machine Learning Basics', 'Neural Networks', 'Applications']
      } : null
    };

    await new Promise(resolve => setTimeout(resolve, 1000));
    setResults(mockResults);
    setIsProcessing(false);
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setSelectedOptions([]);
    setResults(null);
    setIsProcessing(false);
    setProcessingStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                📚 PrepPal
              </span>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Dashboard</a>
                  <a href="#" className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium">Upload</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">My Materials</a>
                  <a href="#" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">Pricing</a>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">👤 John Doe</span>
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                Upgrade
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your PDFs into 
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Study Materials
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Upload your PDF and let our AI create summaries, flashcards, and quizzes
          </p>
        </div>

        {!isProcessing && !results && (
          <>
            {/* File Upload Area */}
            <div className="mb-12">
              <div
                className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50' 
                    : uploadedFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="flex items-center justify-center space-x-4">
                    <FileText className="w-12 h-12 text-green-600" />
                    <div className="text-left">
                      <p className="text-lg font-semibold text-green-800">{uploadedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={resetUpload}
                      className="ml-4 p-2 text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Drop your PDF here or click to browse
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Support for PDF files up to 50MB
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
                    >
                      Choose File
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Generation Options */}
            {uploadedFile && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  What would you like to generate?
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {generationOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        selectedOptions.includes(option.id)
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {selectedOptions.includes(option.id) && (
                        <div className="absolute top-4 right-4">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${
                        option.color === 'blue' ? 'bg-blue-100' :
                        option.color === 'purple' ? 'bg-purple-100' :
                        'bg-pink-100'
                      }`}>
                        <div className={`${
                          option.color === 'blue' ? 'text-blue-600' :
                          option.color === 'purple' ? 'text-purple-600' :
                          'text-pink-600'
                        }`}>
                          {option.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 mb-3">{option.description}</p>
                      <span className="text-sm text-gray-500">{option.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Button */}
            {uploadedFile && selectedOptions.length > 0 && (
              <div className="text-center">
                <button
                  onClick={handleGenerate}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-12 py-4 rounded-xl font-medium text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Zap className="inline w-5 h-5 mr-2" />
                  Generate Study Materials
                  <ArrowRight className="inline w-5 h-5 ml-2" />
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  Estimated processing time: ~{Math.max(...selectedOptions.map(id => 
                    generationOptions.find(opt => opt.id === id)?.time.match(/\d+/)[0]
                  ))} minutes
                </p>
              </div>
            )}
          </>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-xl">
            <div className="w-24 h-24 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin">
                <div className="w-full h-full bg-white rounded-full m-1"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Processing Your PDF
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              {processingSteps[processingStep]}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {processingStep + 1} of {processingSteps.length} steps completed
            </p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Study Materials Are Ready!
              </h2>
              <p className="text-lg text-gray-600">
                Generated from {uploadedFile.name}
              </p>
            </div>

            <div className="grid gap-6">
              {results.summary && (
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center mb-4">
                    <FileText className="w-6 h-6 text-blue-600 mr-3" />
                    <h3 className="text-xl font-semibold text-gray-900">Smart Summary</h3>
                  </div>
                  <p className="text-gray-700 mb-6">{results.summary.content}</p>
                  <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download Summary
                  </button>
                </div>
              )}

              {results.flashcards && (
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <BookOpen className="w-6 h-6 text-purple-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Flashcards</h3>
                    </div>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {results.flashcards.count} cards
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {results.flashcards.cards.map((card, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-medium text-gray-900 mb-2">{card.front}</p>
                        <p className="text-gray-600 text-sm">{card.back}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-4">
                    <button className="flex items-center text-purple-600 hover:text-purple-700 font-medium">
                      <Download className="w-4 h-4 mr-2" />
                      Export to Anki
                    </button>
                    <button className="flex items-center text-purple-600 hover:text-purple-700 font-medium">
                      Start Practice
                    </button>
                  </div>
                </div>
              )}

              {results.quiz && (
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <Brain className="w-6 h-6 text-pink-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Practice Quiz</h3>
                    </div>
                    <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                      {results.quiz.questions} questions
                    </span>
                  </div>
                  <div className="mb-6">
                    <p className="text-gray-700 mb-3">Topics covered:</p>
                    <div className="flex flex-wrap gap-2">
                      {results.quiz.topics.map((topic, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-colors">
                    Start Quiz
                  </button>
                </div>
              )}
            </div>

            <div className="text-center pt-8">
              <button
                onClick={resetUpload}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Upload Another PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFUploadPage;