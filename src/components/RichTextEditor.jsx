import React, { useRef, useCallback, useEffect, useState } from 'react';

const RichTextEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);
    const isInitialized = useRef(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

    useEffect(() => {
        if (editorRef.current && !isInitialized.current) {
            editorRef.current.innerHTML = value || '';
            isInitialized.current = true;
            setupImageHandlers();
        }
    }, []);

    useEffect(() => {
        if (editorRef.current && value === '' && isInitialized.current) {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    const setupImageHandlers = () => {
        if (!editorRef.current) return;
        const images = editorRef.current.querySelectorAll('img');
        images.forEach(img => {
            img.style.cursor = 'pointer';
            img.onclick = (e) => {
                e.stopPropagation();
                selectImage(img);
            };
        });
    };

    const selectImage = (img) => {
        // Deselect previous
        if (selectedImage) {
            selectedImage.style.outline = 'none';
            const wrapper = selectedImage.parentElement;
            if (wrapper && wrapper.classList.contains('resize-wrapper')) {
                wrapper.replaceWith(selectedImage);
            }
        }

        setSelectedImage(img);
        img.style.outline = '3px solid #3b82f6';
        img.style.outlineOffset = '2px';
    };

    const deselectImage = () => {
        if (selectedImage) {
            selectedImage.style.outline = 'none';
            selectedImage.style.outlineOffset = '0';
        }
        setSelectedImage(null);
    };

    const startResize = (e, corner) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedImage) return;

        setIsResizing(true);
        resizeStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: selectedImage.offsetWidth,
            height: selectedImage.offsetHeight
        };

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - resizeStartPos.current.x;
            const deltaY = moveEvent.clientY - resizeStartPos.current.y;

            let newWidth = resizeStartPos.current.width;
            let newHeight = resizeStartPos.current.height;

            if (corner.includes('right')) newWidth += deltaX;
            if (corner.includes('left')) newWidth -= deltaX;
            if (corner.includes('bottom')) newHeight += deltaY;
            if (corner.includes('top')) newHeight -= deltaY;

            // Maintain aspect ratio
            const aspectRatio = resizeStartPos.current.width / resizeStartPos.current.height;
            if (corner === 'bottom-right' || corner === 'top-left') {
                newHeight = newWidth / aspectRatio;
            }

            // Minimum size
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);

            selectedImage.style.width = `${newWidth}px`;
            selectedImage.style.height = `${newHeight}px`;
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const execCommand = useCallback((command, cmdValue = null) => {
        document.execCommand(command, false, cmdValue);
        editorRef.current?.focus();
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            setTimeout(setupImageHandlers, 0);
        }
    }, [onChange]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            setTimeout(setupImageHandlers, 0);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const handleEditorClick = (e) => {
        if (e.target.tagName === 'IMG') {
            selectImage(e.target);
        } else {
            deselectImage();
        }
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertHTML', `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; cursor: pointer;" />`);
        }
    };

    const insertLink = () => {
        const url = prompt('Enter link URL:');
        const text = window.getSelection().toString() || prompt('Enter link text:');
        if (url && text) {
            execCommand('insertHTML', `<a href="${url}" target="_blank" style="color: #2563eb;">${text}</a>`);
        }
    };

    const ToolButton = ({ onClick, icon, title }) => (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                padding: '8px 12px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                color: '#374151',
                fontSize: '0.9rem',
                transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
            onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
            <i className={`fas ${icon}`}></i>
        </button>
    );

    const Divider = () => <div style={{ width: '1px', background: '#e2e8f0', margin: '0 5px', height: '24px' }}></div>;

    const ResizeHandle = ({ position, onMouseDown }) => {
        const positionStyles = {
            'top-left': { top: '-6px', left: '-6px', cursor: 'nwse-resize' },
            'top-right': { top: '-6px', right: '-6px', cursor: 'nesw-resize' },
            'bottom-left': { bottom: '-6px', left: '-6px', cursor: 'nesw-resize' },
            'bottom-right': { bottom: '-6px', right: '-6px', cursor: 'nwse-resize' }
        };

        return (
            <div
                onMouseDown={(e) => onMouseDown(e, position)}
                style={{
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: '#3b82f6',
                    border: '2px solid white',
                    borderRadius: '50%',
                    ...positionStyles[position]
                }}
            />
        );
    };

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '2px',
                padding: '8px',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                alignItems: 'center'
            }}>
                <ToolButton onClick={() => execCommand('bold')} icon="fa-bold" title="Bold (Ctrl+B)" />
                <ToolButton onClick={() => execCommand('italic')} icon="fa-italic" title="Italic (Ctrl+I)" />
                <ToolButton onClick={() => execCommand('underline')} icon="fa-underline" title="Underline (Ctrl+U)" />
                <ToolButton onClick={() => execCommand('strikeThrough')} icon="fa-strikethrough" title="Strikethrough" />

                <Divider />

                <select
                    onChange={(e) => { if (e.target.value) { execCommand('formatBlock', e.target.value); e.target.value = ''; } }}
                    style={{ padding: '6px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }}
                    defaultValue=""
                >
                    <option value="">Heading</option>
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                    <option value="p">Paragraph</option>
                </select>

                <Divider />

                <ToolButton onClick={() => execCommand('insertUnorderedList')} icon="fa-list-ul" title="Bullet List" />
                <ToolButton onClick={() => execCommand('insertOrderedList')} icon="fa-list-ol" title="Numbered List" />

                <Divider />

                <ToolButton onClick={() => execCommand('justifyLeft')} icon="fa-align-left" title="Align Left" />
                <ToolButton onClick={() => execCommand('justifyCenter')} icon="fa-align-center" title="Center" />
                <ToolButton onClick={() => execCommand('justifyRight')} icon="fa-align-right" title="Align Right" />

                <Divider />

                <ToolButton onClick={insertLink} icon="fa-link" title="Insert Link" />
                <ToolButton onClick={insertImage} icon="fa-image" title="Insert Image" />

                <Divider />

                <ToolButton onClick={() => execCommand('removeFormat')} icon="fa-eraser" title="Clear Format" />
            </div>

            {/* Image resize controls - show when image is selected */}
            {selectedImage && (
                <div style={{
                    padding: '8px 15px',
                    background: '#dbeafe',
                    borderBottom: '1px solid #93c5fd',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    fontSize: '0.85rem'
                }}>
                    <span style={{ color: '#1e40af' }}>
                        <i className="fas fa-image" style={{ marginRight: '6px' }}></i>
                        Image selected - Drag corners to resize
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ color: '#64748b' }}>Width:</label>
                        <input
                            type="number"
                            value={Math.round(selectedImage?.offsetWidth || 0)}
                            onChange={(e) => {
                                if (selectedImage) {
                                    const newWidth = parseInt(e.target.value) || 100;
                                    const aspectRatio = selectedImage.offsetWidth / selectedImage.offsetHeight;
                                    selectedImage.style.width = `${newWidth}px`;
                                    selectedImage.style.height = `${newWidth / aspectRatio}px`;
                                    onChange(editorRef.current.innerHTML);
                                }
                            }}
                            style={{ width: '70px', padding: '4px 8px', border: '1px solid #93c5fd', borderRadius: '4px' }}
                        />
                        <span style={{ color: '#64748b' }}>px</span>
                    </div>
                    <button
                        onClick={deselectImage}
                        style={{
                            marginLeft: 'auto',
                            padding: '4px 12px',
                            background: '#1e40af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                    >
                        Done
                    </button>
                </div>
            )}

            <div style={{ position: 'relative' }}>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onClick={handleEditorClick}
                    data-placeholder={placeholder}
                    style={{
                        minHeight: '200px',
                        padding: '15px',
                        outline: 'none',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        background: 'white'
                    }}
                />

                {/* Resize handles overlay */}
                {selectedImage && (
                    <div style={{
                        position: 'absolute',
                        top: selectedImage.offsetTop + (editorRef.current?.offsetTop || 0) - 15,
                        left: selectedImage.offsetLeft + (editorRef.current?.offsetLeft || 0) - 15,
                        width: selectedImage.offsetWidth,
                        height: selectedImage.offsetHeight,
                        pointerEvents: 'none'
                    }}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'auto' }}>
                            <ResizeHandle position="top-left" onMouseDown={startResize} />
                            <ResizeHandle position="top-right" onMouseDown={startResize} />
                            <ResizeHandle position="bottom-left" onMouseDown={startResize} />
                            <ResizeHandle position="bottom-right" onMouseDown={startResize} />
                        </div>
                    </div>
                )}
            </div>

            <div style={{ padding: '8px 15px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8' }}>
                <i className="fas fa-keyboard" style={{ marginRight: '5px' }}></i>
                Ctrl+B Bold | Ctrl+I Italic | Ctrl+U Underline | Click image to resize
            </div>
        </div>
    );
};

export default RichTextEditor;

