-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 11, 2025 at 02:11 PM
-- Server version: 9.1.0
-- PHP Version: 8.1.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `video_delivery`
--

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
CREATE TABLE IF NOT EXISTS `videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `video_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `partner_id` int DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `course` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lesson` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `module` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `topic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `streaming_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redirect_slug` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT '0' COMMENT 'Duration in seconds',
  `size` bigint DEFAULT '0' COMMENT 'File size in bytes',
  `version` int DEFAULT '1',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `activity` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `views` int DEFAULT '0' COMMENT 'Number of times video has been viewed',
  PRIMARY KEY (`id`),
  UNIQUE KEY `video_id` (`video_id`),
  UNIQUE KEY `redirect_slug` (`redirect_slug`),
  KEY `idx_video_id` (`video_id`),
  KEY `idx_subject` (`subject`),
  KEY `idx_grade` (`grade`),
  KEY `idx_unit` (`unit`),
  KEY `idx_lesson` (`lesson`),
  KEY `idx_module` (`module`),
  KEY `idx_status` (`status`),
  KEY `idx_redirect_slug` (`redirect_slug`),
  KEY `idx_grade_unit_lesson` (`grade`,`unit`,`lesson`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `videos`
--

INSERT INTO `videos` (`id`, `video_id`, `partner_id`, `title`, `subject`, `course`, `grade`, `unit`, `lesson`, `module`, `topic`, `description`, `language`, `file_path`, `streaming_url`, `qr_url`, `thumbnail_url`, `redirect_slug`, `duration`, `size`, `version`, `status`, `created_by`, `created_at`, `updated_at`, `activity`, `views`) VALUES
(31, 'VID_9DIU5GGRPG', NULL, 'Recording20250610165638_master - Copy', 'Test', NULL, '1', '1', '1', '1', NULL, '1', 'en', 'upload/VID_9DIU5GGRPG.mp4', 'http://localhost:5000/api/s/p7coszdui3', '/qr-codes/VID_9DIU5GGRPG.png', NULL, 'p7coszdui3', 0, 8122407, 1, 'active', 1, '2025-12-11 09:51:43', '2025-12-11 09:51:56', NULL, 1),
(32, 'VID_9F60A8958O', NULL, 'Elementry', 'Test', NULL, '1', '1', '2', '3', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60A8958O.mp4', 'http://localhost:5000/api/s/pttusliygk', '/qr-codes/VID_9F60A8958O.png', NULL, 'pttusliygk', 0, 34427523, 1, 'active', 1, '2025-12-11 09:55:41', '2025-12-11 09:55:41', NULL, 0),
(33, 'VID_9F60A8YSVS', NULL, 'Recording 2025-11-17 131209', 'Test', NULL, '2', '2', '2', '1', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60A8YSVS.mp4', 'http://localhost:5000/api/s/nd9diuiyj7', '/qr-codes/VID_9F60A8YSVS.png', NULL, 'nd9diuiyj7', 0, 5304547, 1, 'active', 1, '2025-12-11 09:55:41', '2025-12-11 09:55:41', NULL, 0),
(34, 'VID_9F60AV571G', NULL, 'final_video', 'Test', NULL, '3', '3', '1', '2', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60AV571G.mp4', 'http://localhost:5000/api/s/mjimbbizwo', '/qr-codes/VID_9F60AV571G.png', NULL, 'mjimbbizwo', 0, 217228977, 1, 'active', 1, '2025-12-11 09:55:43', '2025-12-11 09:55:43', NULL, 0),
(35, 'VID_9F60B8OIID', NULL, 'assignment creation and rubirics', 'Tes', NULL, '4', '3', '2', '3', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60B8OIID.mp4', 'http://localhost:5000/api/s/ebituwj05t', '/qr-codes/VID_9F60B8OIID.png', NULL, 'ebituwj05t', 0, 34964033, 1, 'active', 1, '2025-12-11 09:55:43', '2025-12-11 09:55:43', NULL, 0),
(36, 'VID_9F60BNXS4J', NULL, 'teacher_resources', 'Test', NULL, '5', '1', '3', '3', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60BNXS4J.mp4', 'http://localhost:5000/api/s/aodndpj09j', '/qr-codes/VID_9F60BNXS4J.png', NULL, 'aodndpj09j', 0, 10205557, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(37, 'VID_9F60B8UA1R', NULL, 'pacing_guide', 'Test', NULL, '5', '2', '3', '2', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60B8UA1R.mp4', 'http://localhost:5000/api/s/kgeyu4j0h9', '/qr-codes/VID_9F60B8UA1R.png', NULL, 'kgeyu4j0h9', 0, 26237700, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(38, 'VID_9F60BYY74T', NULL, 'teacher_dashboard', 'Test', NULL, '7', '3', '42', '2', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60BYY74T.mp4', 'http://localhost:5000/api/s/irzovbj0mt', '/qr-codes/VID_9F60BYY74T.png', NULL, 'irzovbj0mt', 0, 19258230, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(39, 'VID_9F60B491JV', NULL, 'Firefly A cinematic 2D animation in 16-9 aspect ratio. The screen starts completely black. Gradually', 'Test', NULL, '6', '3', '1', '2', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60B491JV.mp4', 'http://localhost:5000/api/s/ituffaj0o8', '/qr-codes/VID_9F60B491JV.png', NULL, 'ituffaj0o8', 0, 227239, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(40, 'VID_9F60B03TQZ', NULL, 'Untitled design', 'Test', NULL, '7', '3', '1', '23', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60B03TQZ.mp4', 'http://localhost:5000/api/s/ficlicj0pp', '/qr-codes/VID_9F60B03TQZ.png', NULL, 'ficlicj0pp', 0, 472983, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(41, 'VID_9F60B28OUC', NULL, 'G10', 'Test', NULL, '6', '3', '1', '3', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60B28OUC.mp4', 'http://localhost:5000/api/s/hbppzyj0wa', '/qr-codes/VID_9F60B28OUC.png', NULL, 'hbppzyj0wa', 0, 20376648, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(42, 'VID_9F60BNNZUB', NULL, '14487142_640_360_60fps', 'Test', NULL, '5', '3', '2', '4', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60BNNZUB.mp4', 'http://localhost:5000/api/s/uxfreij0xv', '/qr-codes/VID_9F60BNNZUB.png', NULL, 'uxfreij0xv', 0, 1144317, 1, 'active', 1, '2025-12-11 09:55:44', '2025-12-11 09:55:44', NULL, 0),
(43, 'VID_9F60CL8D44', NULL, '3163534-uhd_3840_2160_30fps', 'Test', NULL, '6', '3', '2', '5', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60CL8D44.mp4', 'http://localhost:5000/api/s/umq9gbj1gb', '/qr-codes/VID_9F60CL8D44.png', NULL, 'umq9gbj1gb', 0, 71070000, 1, 'active', 1, '2025-12-11 09:55:45', '2025-12-11 09:55:45', NULL, 0),
(44, 'VID_9F60CGSYJQ', NULL, 'bg', 'Test', NULL, '5', '3', '2', '5', NULL, 'Test descriptiop', 'en', 'upload/VID_9F60CGSYJQ.mp4', 'http://localhost:5000/api/s/z1eumwj1nm', '/qr-codes/VID_9F60CGSYJQ.png', NULL, 'z1eumwj1nm', 0, 25015255, 1, 'active', 1, '2025-12-11 09:55:45', '2025-12-11 09:55:45', NULL, 0);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
