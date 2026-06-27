package main.java.de.svnd3.ldstream.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class FileReader {

    @Autowired private ConfigService config;

    private static final String FILE_BASE_URL = "www/";
    private static final Logger LOGGER = Logger.getLogger(FileReader.class.getName());

    private final HashMap<String, String> textCache   = new HashMap<>();
    private final HashMap<String, byte[]> binaryCache = new HashMap<>();

    private String readFile(String fileName) {
        try {
            return new String(FileUtils.readFileToByteArray(new File(FILE_BASE_URL + fileName)), StandardCharsets.UTF_8);
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Error reading file '" + fileName + "': " + e.getMessage());
            return null;
        }
    }

    private byte[] readBinaryFile(String fileName) {
        try {
            return FileUtils.readFileToByteArray(new File(FILE_BASE_URL + fileName));
        } catch (IOException e) {
            LOGGER.log(Level.SEVERE, "Error reading binary file '" + fileName + "': " + e.getMessage());
            return null;
        }
    }

    public String getTextFileContents(String fileName) {
        if (config.textCacheEnabled()) {
            textCache.computeIfAbsent(fileName, this::readFile);
            return textCache.get(fileName);
        }
        return readFile(fileName);
    }

    public byte[] getBinaryFileContents(String fileName) {
        if (config.binaryCacheEnabled()) {
            binaryCache.computeIfAbsent(fileName, this::readBinaryFile);
            return binaryCache.get(fileName);
        }
        return readBinaryFile(fileName);
    }
}
