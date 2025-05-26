import fs from 'fs/promises'

/**
 * Reads a file from the local filesystem and returns it as a Buffer.
 */
export const readFileAsBuffer = async (filePath: string): Promise<Buffer> => {
  try {
    console.log('in s3Uploader.ts >  readFileAsBuffer filePath:', filePath)

    const buffer = await fs.readFile(filePath)
    return buffer
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    throw new Error(`Failed to read file: ${filePath}`)
  }
}

/**
 * Uploads a file buffer to a pre-signed S3 URL.
 */
export const uploadToS3 = async (
  uploadUrl: string,
  fileBuffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<void> => {
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: fileBuffer
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('S3 upload failed:', response.status, errorText)
      throw new Error(`S3 upload failed: ${response.status}`)
    }
    console.log('Successfully uploaded to S3.')
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw error // Re-throw the error to be caught by the caller
  }
}

/**
 * Deletes a local file.
 */
export const deleteLocalFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath)
    console.log(`Successfully deleted local file: ${filePath}`)
  } catch (error) {
    console.error(`Error deleting local file ${filePath}:`, error)
    // Log error but don't throw, as this is a cleanup step
  }
}
