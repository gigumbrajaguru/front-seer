import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReadingService } from '../../../core/services/reading.service';
import { FileUploadService } from '../../../core/services/file-upload.service';

@Component({
  selector: 'app-question-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './question-panel.component.html',
  styleUrl: './question-panel.component.scss'
})
export class QuestionPanelComponent {
  questionChanged = output<string>();

  private readonly readingService = inject(ReadingService);
  private readonly fileUploadService = inject(FileUploadService);

  question = '';
  fileName = '';
  fileError = '';
  isDragOver = false;

  /** Persists question text in the shared reading session as the user types. */
  onQuestionChange(): void {
    this.readingService.setQuestion(this.question);
    this.questionChanged.emit(this.question);
  }

  /** Reads a selected file from the hidden file input. */
  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
  }

  /** Handles drag-and-drop text file upload into the question panel. */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  /** Enables drag-over styling while a file is over the drop zone. */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  /** Clears drag-over styling after the pointer leaves the drop zone. */
  onDragLeave(): void {
    this.isDragOver = false;
  }

  /** Reads a text file and stores its contents as additional reading context. */
  private async processFile(file: File): Promise<void> {
    this.fileError = '';
    try {
      const content = await this.fileUploadService.readTextFile(file);
      this.fileName = file.name;
      this.readingService.setFileContent(content);
    } catch (err: any) {
      this.fileError = err.message ?? 'Failed to read file';
    }
  }

  /** Removes uploaded context from the current reading session. */
  clearFile(): void {
    this.fileName = '';
    this.readingService.setFileContent('');
  }
}
