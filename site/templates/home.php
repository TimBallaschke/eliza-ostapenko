<?php
$asset = function ($path) {
    $file = kirby()->root('index') . '/' . $path;
    $version = file_exists($file) ? filemtime($file) : 1;
    return url($path) . '?v=' . $version;
};
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="description" content="Elizaveta Ostapenko is a visual artist based in Hamburg, Germany. She works primarily with painting, printmaking and sculpture.">
    <title>Elizaveta Ostapenko</title>
    <link rel="icon" type="image/svg+xml" href="<?= url('assets/svg/favicon-01.svg') ?>">
    <link rel="shortcut icon" type="image/svg+xml" href="<?= url('assets/svg/favicon-01.svg') ?>">
    <link rel="stylesheet" href="<?= $asset('assets/style/style.css') ?>">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js"></script>


</head>
    <body class="initialize">
        <header id="header" class="">
            <div class="title">Elizaveta Ostapenko</div>
            <div class="about-button">About</div>
            <div class="calendar-close-button">Close</div>
            <div class="calendar-button">Calendar</div>
            <div class="mobile-menu-button">
                <div class="mobile-menu-dot"></div>
                <div class="mobile-menu-dot"></div>
            </div>
            <div class="mobile-menu-close display-none">Close</div>
            <div class="mobile-menu-back display-none">Back</div>
            <div class="mobile-menu">
                <div class="mobile-menu-about mobile-menu-item no-opacity">About</div>
                <div class="mobile-menu-calendar mobile-menu-item no-opacity">Calendar</div>
            </div>
        </header>
        <div class="about-outter-container">
            <?php $about = $site->find('about'); ?>
            <div class="about-scroll-container">
                <div class="about-container">
                    <div class="about-text"><?= $about->aboutTextarea() ?></div>
                    <div class="contact-container">
                        <div class="contact-headline headline">Contact</div>
                        <div class="artist-image">
                            <?php if ($titleImageFile = $about->titleImage()->toFile()): ?>
                                <img 
                                    src="<?= $titleImageFile->thumb(['width' => 800, 'quality' => 90, 'format' => 'webp'])->url() ?>" 
                                    alt="<?= $titleImageFile->alt() ?>" 
                                    loading="lazy" 
                                    decoding="async" />
                            <?php endif; ?>
                        </div>
                        <div class="contact-info"><?= $about->contactInfo()->kt() ?></div>
                        <div class="contact-mail-instagram">
                            E-Mail: <a href="mailto:<?= $about->eMail()->html() ?>" class="italic email-link"><?= $about->eMail()->html() ?></a>
                            Instagram: <a href="<?= $about->instagramUrl() ?>" target="_blank" class="italic"><?= $about->instagram()->html() ?></a>
                        </div>
                        <a href="https://f679d433.sibforms.com/serve/MUIFAP1NdVfOaSmHOlS6MWg9-PmnNL30aXfXjIerALY5CDHGpwwn26dsT_3wOtBvdcrFwF-c7U2JJqeghUsRpMux2nYWEp3FK2ra_YTBwzM0xYHPq-Ko76tUKBmdGdvktzBaDq6nukFwm0WmKlSuWS30sPXBiDjnhK_Z7e39n3cen3evSwvBINg-6r6gaWun82g7pxuF1hSd20TJ?fbclid=PAZXh0bgNhZW0CMTEAAacXXuVzmw1SAEdSXbOe_JDTewqr50QwImFa9Eoj0NtsISlk0-TI9s05UIGzjw_aem_6zupK2UkIwB3R8AmWxT2hQ" target="_blank" class="contact-newsletter-button italic">Subscribe to Newsletter</a>
                        <!-- <div class="contact-portfolio-download">
                            <span class="arrow arrow-down">↓</span>
                            <span class="italic">Download Portfolio</span>
                        </div> -->
                    </div>
                    <div class="cv-container">
                        <div class="cv-headline headline">
                            <div class="cv-headline-text">CV</div>
                            <!-- <div class="cv-download-button">
                                <span class="arrow arrow-down">↓</span>
                                <span class="italic">Download CV</span>
                            </div> -->
                        </div>
                        <div class="education-container cv-element">
                            <div class="subheadline italic">Education</div>
                            <div class="cv-element-content">
                                <?php 
                                try {
                                    $educationStructure = $about->education()->toStructure();
                                    if ($educationStructure && $educationStructure->count() > 0) {
                                        $lastYearShown = null;
                                        foreach ($educationStructure as $education): 
                                            $currentYear = $education->yearStart();
                                            if ($education->yearEnd()->isNotEmpty()) {
                                                $currentYear .= ' – ' . $education->yearEnd();
                                            }
                                            
                                            // Show year only if it's different from the last one shown
                                            if ($lastYearShown === null || $currentYear != $lastYearShown) {
                                                $showYear = $currentYear;
                                                $lastYearShown = $currentYear;
                                            } else {
                                                $showYear = '';
                                            }
                                        ?>
                                            <div class="education-entry cv-entry">
                                                <div class="education-years">
                                                    <?= $showYear ?>
                                                </div>
                                                <div class="education-text cv-entry-text">
                                                    <?= $education->entry() ?>
                                                </div>
                                            </div>
                                            <br>
                                        <?php endforeach;
                                    }
                                } catch (Exception $e) {
                                    // Handle invalid education data gracefully
                                }
                                ?>
                            </div>
                        </div>
                        <div class="solo-exhibitions-container cv-element">
                            <div class="subheadline italic">Solo Exhibitions</div>
                            <div class="cv-element-content">
                                <?php 
                                try {
                                    $soloExhibitionsStructure = $about->soloExhibitions()->toStructure();
                                    if ($soloExhibitionsStructure && $soloExhibitionsStructure->count() > 0) {
                                        $lastYearShown = null;
                                        foreach ($soloExhibitionsStructure as $soloExhibition): 
                                            $currentYear = $soloExhibition->yearStart();
                                            if ($soloExhibition->yearEnd()->isNotEmpty()) {
                                                $currentYear .= ' – ' . $soloExhibition->yearEnd();
                                            }
                                            
                                            // Show year only if it's different from the last one shown
                                            if ($lastYearShown === null || $currentYear != $lastYearShown) {
                                                $showYear = $currentYear;
                                                $lastYearShown = $currentYear;
                                            } else {
                                                $showYear = '';
                                            }
                                        ?>
                                            <div class="solo-exhibition-entry cv-entry">
                                                <div class="solo-exhibition-years">
                                                    <?= $showYear ?>
                                                </div>
                                                <div class="solo-exhibition-text cv-entry-text">
                                                    <?= $soloExhibition->exhibition() ?>
                                                </div>
                                            </div>
                                            <br>
                                        <?php endforeach;
                                    }
                                } catch (Exception $e) {
                                    // Handle invalid soloExhibitions data gracefully
                                }
                                ?>
                            </div>
                        </div>
                        <div class="group-exhibitions-container cv-element">
                            <div class="subheadline italic">Group Exhibitions (Selection)</div>
                            <div class="cv-element-content">
                                <?php 
                                try {
                                    $groupExhibitionsStructure = $about->groupExhibitions()->toStructure();
                                    if ($groupExhibitionsStructure && $groupExhibitionsStructure->count() > 0) {
                                        $lastYearShown = null;
                                        foreach ($groupExhibitionsStructure as $groupExhibition): 
                                            $currentYear = $groupExhibition->yearStart();
                                            
                                            // Show year only if it's different from the last one shown
                                            if ($lastYearShown === null || $currentYear != $lastYearShown) {
                                                $showYear = $currentYear;
                                                $lastYearShown = $currentYear;
                                            } else {
                                                $showYear = '';
                                            }
                                        ?>
                                            <div class="group-exhibition-entry cv-entry">
                                                <div class="group-exhibition-years">
                                                    <?= $showYear ?>
                                                </div>
                                                <div class="group-exhibition-text cv-entry-text">
                                                    <?= $groupExhibition->exhibition() ?>
                                                </div>
                                            </div>
                                            <br>
                                        <?php endforeach;
                                    }
                                } catch (Exception $e) {
                                    // Handle invalid groupExhibitions data gracefully
                                }
                                ?>
                            </div>
                        </div>
                        <div class="awards-container cv-element">
                            <div class="subheadline italic">Awards & Scholarships</div>
                            <div class="cv-element-content">
                                <?php 
                                try {
                                    $awardsStructure = $about->awards()->toStructure();
                                    if ($awardsStructure && $awardsStructure->count() > 0) {
                                        $lastYearShown = null;
                                        foreach ($awardsStructure as $award): 
                                            $currentYear = $award->yearStart();
                                            if ($award->yearEnd()->isNotEmpty()) {
                                                $currentYear .= ' – ' . $award->yearEnd();
                                            }
                                            
                                            // Show year only if it's different from the last one shown
                                            if ($lastYearShown === null || $currentYear != $lastYearShown) {
                                                $showYear = $currentYear;
                                                $lastYearShown = $currentYear;
                                            } else {
                                                $showYear = '';
                                            }
                                        ?>
                                            <div class="award-entry cv-entry">
                                                <div class="award-years">
                                                    <?= $showYear ?>
                                                </div>
                                                <div class="award-text cv-entry-text">
                                                    <?= $award->title() ?>
                                                </div>
                                            </div>
                                            <br>
                                        <?php endforeach;
                                    }
                                } catch (Exception $e) {
                                    // Handle invalid awards data gracefully
                                }
                                ?>
                            </div>
                        </div>
                        <div class="resedencies-container cv-element">
                            <div class="subheadline italic">Residencies</div>
                            <div class="cv-element-content">
                                <?php 
                                try {
                                    $residencyStructure = $about->residency()->toStructure();
                                    if ($residencyStructure && $residencyStructure->count() > 0) {
                                        $lastYearShown = null;
                                        foreach ($residencyStructure as $residency): 
                                            $currentYear = $residency->yearStart();
                                            if ($residency->yearEnd()->isNotEmpty()) {
                                                $currentYear .= ' – ' . $residency->yearEnd();
                                            }
                                            
                                            // Show year only if it's different from the last one shown
                                            if ($lastYearShown === null || $currentYear != $lastYearShown) {
                                                $showYear = $currentYear;
                                                $lastYearShown = $currentYear;
                                            } else {
                                                $showYear = '';
                                            }
                                        ?>
                                            <div class="residency-entry cv-entry">
                                                <div class="residency-years">
                                                    <?= $showYear ?>
                                                </div>
                                                <div class="residency-text cv-entry-text">
                                                    <?= $residency->title() ?>
                                                </div>
                                            </div>
                                            <br>
                                        <?php endforeach;
                                    }
                                } catch (Exception $e) {
                                    // Handle invalid residency data gracefully
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="press-container">
                        <div class="press-headline headline">Press</div>
                        <div class="press-content">
                            <?php 
                            try {
                                $pressStructure = $about->press()->toStructure();
                                if ($pressStructure && $pressStructure->count() > 0) {
                                    foreach ($pressStructure as $press): ?>
                                        <div class="press-entry">
                                            <?php if ($press->url()->isNotEmpty()): ?>
                                                <a href="<?= $press->url() ?>" target="_blank" class="press-entry-title">
                                                    <span class="arrow arrow-margin">→</span><span class="press-entry-title-text"><?= $press->title()->kt()->inline() ?></span>
                                                </a>
                                            <?php elseif ($press->pdf()->toFile()): ?>
                                                <a href="<?= $press->pdf()->toFile()->url() ?>" target="_blank" class="press-entry-title">
                                                    <span class="arrow arrow-margin">→</span><span class="press-entry-title-text"><?= $press->title()->kt()->inline() ?></span>
                                                </a>
                                            <?php else: ?>
                                                <div class="press-entry-title">
                                                    <span class="arrow arrow-margin">→</span><span class="press-entry-title-text"><?= $press->title()->kt()->inline() ?></span>
                                                </div>
                                            <?php endif; ?>
                                        </div>
                                    <?php endforeach;
                                }
                            } catch (Exception $e) {
                                // Handle invalid press data gracefully
                            }
                            ?>
                        </div>
                    </div>
                    <div class="imprint">
                    <div class="headline">Imprint</div>
                        <div class="imprint-element">
                            Elizaveta Ostapenko<br>
                            Visual Artist<br>
                            Hammer Steindamm 53<br>
                            22089 Hamburg<br>
                            <br>
                            Phone: +49 176 76867414<br>
                            Email: contact@elizavetaostapenko.com
                        </div>
                        <div class="subheadline italic">Hosting</div>
                        <div class="imprint-element">
                            netcup GmbH<br>
                            Daimlerstraße 25<br>
                            DE-76185 Karlsruhe
                        </div>
                        <div class="subheadline italic">Design & Development</div>
                        <div class="imprint-element">
                            Design: Maja Redlin & Tim Ballaschke<br>
                            Development: Tim Ballaschke<br>
                            Font: Paragon by Marcel Saidov<br>
                            <br>
                            <a href="https://www.majaredlin.de" target="_blank"><span class="arrow arrow-margin">→</span>majaredlin.de</a><br>
                            <a href="https://www.timballaschke.com" target="_blank"><span class="arrow arrow-margin">→</span>timballaschke.com</a><br>
                            <a href="https://marcelsaidov.de/" target="_blank"><span class="arrow arrow-margin">→</span>marcelsaidov.de</a>
                        </div>
                        <div class="headline">Privacy Policy</div>
                        <div class="imprint-element">
                            Data Controller under applicable data protection law (GDPR):<br>
                            Elizaveta Ostapenko<br>
                            Visual Artist<br>
                            Hammer Steindamm 53<br>
                            22089 Hamburg<br>
                            Email: contact@elizavetaostapenko.com<br>
                            Phone: +49 176 76867414
                        </div>
                        <div class="subheadline italic">Collection and Processing of Personal Data</div>
                        <div class="imprint-element">
                            When this website is accessed, certain technical information (such as IP address, date and time of access, browser type, and operating system) is automatically collected by the hosting provider, netcup GmbH. This information is processed solely to ensure the secure and reliable operation of the website, to analyze usage, and to improve the service.
                        </div>
                        <div class="subheadline italic">Cookies</div>
                        <div class="imprint-element">
                            No analytics or marketing cookies are used on this website. Only cookies strictly necessary for the technical operation of the website may be used. Since no tracking tools are employed, a cookie banner is not required.
                        </div>
                        <div class="subheadline italic">Newsletter</div>
                        <div class="imprint-element">
                            The newsletter is sent via the service provider Brevo (formerly Sendinblue). Email addresses are stored exclusively on Brevo’s servers. Subscription takes place via a link to an external form hosted by Brevo. Unsubscribing from the newsletter is possible at any time via the unsubscribe link included in every newsletter email.
                        </div>
                        <div class="subheadline italic">Storage & Security of Data</div>
                        <div class="imprint-element">
                            Personal data is stored on the servers of netcup GmbH in Germany and on the servers of Brevo. Copies may also be stored locally on a computer system and in associated email programs.<br>
                            <br>
                            <ul>
                                <li>Server log data is retained for a maximum of 14 days and then automatically deleted.</li>
                                <li>Newsletter subscription data is stored until an unsubscribe request or deletion request is received.</li>
                                <li>Local copies are deleted as soon as they are no longer required.</li>
                            </ul>
                            <br>
                            Appropriate technical and organizational measures are implemented to protect personal data against loss, alteration, and unauthorized access. This includes the security measures of the hosting provider (netcup GmbH) and the newsletter service provider (Brevo).
                        </div>
                        <div class="subheadline italic">Fonts</div>
                        <div class="imprint-element">
                            This website uses only locally hosted fonts. No connection is made to external servers (e.g., Google Fonts). As a result, no personal data is transmitted to third parties when the website is loaded.
                        </div>
                        <div class="subheadline italic">User Rights</div>
                        <div class="imprint-element">
                            In accordance with the GDPR, users have the right to:<br>
                            <ul>
                                <li>access the personal data held about them,</li>
                                <li>request rectification or erasure,</li>
                                <li>restrict or object to processing, and</li>
                                <li>request data portability.</li>
                            </ul>
                            <br>
                            Requests may be submitted to: contact@elizavetaostapenko.com.
                        </div>
                        <div class="subheadline italic">Data Protection Officer</div>
                        <div class="imprint-element">
                            As a sole proprietorship, responsibility for data protection lies directly with the operator. No external Data Protection Officer has been appointed.
                        </div>
                        <div class="subheadline italic">External Service Providers</div>
                        <div class="imprint-element">
                            <ul>
                                <li>Hosting: netcup GmbH, Daimlerstraße 25, DE-76185 Karlsruhe</li>
                                <li>Newsletter: Brevo (formerly Sendinblue)</li>
                            </ul>
                        </div>
                        <div class="headline">Disclaimer</div>
                        <div class="subheadline italic">Liability for Content</div>
                        <div class="imprint-element">
                            According to § 7(1) TMG, responsibility for own content on these pages lies with the service provider under general law. Pursuant to §§ 8 to 10 TMG, there is no obligation to monitor transmitted or stored third-party information or to investigate circumstances indicating unlawful activity.<br>
                            <br>
                            Obligations to remove or block the use of information under general law remain unaffected. Liability in this respect is only possible from the time of knowledge of a specific infringement. Upon becoming aware of such infringements, the content in question will be removed immediately.
                        </div>
                        <div class="subheadline italic">Liability for Links</div>
                        <div class="imprint-element">
                            This website contains links to external third-party websites. Responsibility for the content of these linked pages always lies with the respective provider or operator. No liability is accepted for this external content, as there is no control over it.<br>
                            <br>
                            The linked pages were reviewed for possible legal violations at the time of linking, and no unlawful content was identified.<br>
                            <br>
                            Continuous monitoring of the linked pages is not reasonable without concrete evidence of a violation. If legal infringements become known, such links will be removed immediately.
                        </div>
                        <div class="close-imprint-button">
                            <span class="arrow">→</span>
                            <span class="italic">Close Imprint & Privacy Policy</span>
                        </div>                   
                    </div>
                    <div class="imprint-button">
                        <span class="arrow">→</span>
                        <span class="italic">Imprint & Privacy Policy</span>
                    </div>
                </div>


            </div>
        </div>
        <?php if ($seriesPage = $site->find('series')): ?>
          <?php
            // Shuffle once and reuse
            $artworks = $seriesPage->children()->shuffle();
          ?>

          <div class="artworks-overview-outter-container">
            <div class="artworks-overview-scale">
              <div class="artworks-overview">
                <?php 
                $artworkCounter = 1;
                foreach ($artworks as $artwork): ?>
                  <div class="artwork-container">
                    <div class="artwork-number-container">
                      <div class="artwork-number no-opacity"><?= $artworkCounter ?></div>
                    </div>
                    <?php 
                      $artworkTitle = $artwork->title()->value();
                      $sanitizedTitle = preg_replace('/[^a-zA-Z0-9]/', '-', strtolower($artworkTitle));
                      // Clean up multiple consecutive dashes and remove leading/trailing dashes
                      $sanitizedTitle = preg_replace('/-+/', '-', $sanitizedTitle);
                      $sanitizedTitle = trim($sanitizedTitle, '-');
                      $overviewContainerClass = "artwork-images {$sanitizedTitle}-overview";
                    ?>
                    <div class="<?= $overviewContainerClass ?>" data-artwork-title="<?= $artwork->title()->html() ?>">
                      <?php 
                      try {
                        $artworkImagesStructure = $artwork->artworkImages()->toStructure();
                        if ($artworkImagesStructure && $artworkImagesStructure->count() > 0) {
                          foreach ($artworkImagesStructure as $index => $image): 
                            $imageIndex = $index + 1;
                            $imageClasses = "single-image artwork-{$sanitizedTitle}-{$imageIndex}";
                            $isExhibitionView = $image->exhibition_view()->bool();
                            $exhibitionPage = $site->find($image->exhibition()->value());
                            $exhibitionName = $exhibitionPage ? $exhibitionPage->title()->value() : '';
                          ?>
                            <div class="single-image-container not-visible">
                              <?php if($imageFile = $image->artworkImage()->toFile()): ?>
                                <?php
                                  // Determine if this is a landscape image and adjust quality and width accordingly
                                  $isLandscape = $imageFile->isLandscape();
                                  $aspectRatio = $imageFile->ratio();
                                  $isWideLandscape = $isLandscape && $aspectRatio > 1.5; // Wide landscape
                                  
                                  // Adjust quality and width based on aspect ratio
                                  $quality400 = $isWideLandscape ? 90 : 80;
                                  $quality700 = $isWideLandscape ? 92 : 80;
                                  $quality1000 = $isWideLandscape ? 100 : 85;
                                  $quality1500 = $isWideLandscape ? 100 : 90;
                                  
                                  // Adjust widths for landscape images to ensure sufficient resolution
                                  $width400 = $isWideLandscape ? 800 : 400;
                                  $width700 = $isWideLandscape ? 1500 : 700;
                                  $width1000 = $isWideLandscape ? 2000 : 1000;
                                  $width1500 = $isWideLandscape ? 2500 : 1500;
                                ?>
                                <img 
                                  src="<?= $imageFile->thumb(['width' => 100, 'quality' => 30, 'format' => 'webp'])->url() ?>"
                                  data-srcset="<?= $imageFile->srcset([
                                      '400w'  => ['width' => $width400,  'quality' => $quality400, 'format' => 'webp'],
                                      '700w'  => ['width' => $width700,  'quality' => $quality700, 'format' => 'webp'],
                                      '1000w' => ['width' => $width1000, 'quality' => $quality1000, 'format' => 'webp'],
                                      '1500w' => ['width' => $width1500, 'quality' => $quality1500, 'format' => 'webp'],
                                  ]) ?>"
                                  data-sizes="(min-width: 1200px) 25vw, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
                                  alt="<?= $image->caption()->html() ?>" 
                                  class="<?= $imageClasses ?> progressive-image"
                                  data-exhibition-view="<?= $isExhibitionView ? 'true' : 'false' ?>"
                                  data-exhibition="<?= $exhibitionName ?>">
                              <?php endif ?>
                            </div>
                          <?php endforeach;
                        }
                      } catch (Exception $e) {
                        // Handle invalid artworkImages data gracefully
                      }
                      ?>
                    </div>
                  </div>
                  <?php $artworkCounter++; ?>
                <?php endforeach ?>
              </div>
            </div>
          </div>
          <div class="artworks-gallery-outter-container display-none">
            <div class="artworks-gallery">
              <?php 
              $artworkGalleryCounter = 1;
              foreach ($artworks as $artwork): 
                $artworkTitle = $artwork->title()->value();
                $sanitizedTitle = preg_replace('/[^a-zA-Z0-9]/', '-', strtolower($artworkTitle));
                // Clean up multiple consecutive dashes and remove leading/trailing dashes
                $sanitizedTitle = preg_replace('/-+/', '-', $sanitizedTitle);
                $sanitizedTitle = trim($sanitizedTitle, '-');
                $galleryContainerClass = "artwork-gallery-images-container {$sanitizedTitle}-gallery";
              ?>
                <div class="<?= $galleryContainerClass ?>">
                  <div class="artwork-number-gallery-hidden"><?= $artworkGalleryCounter ?></div>
                  <div class="artwork-hidden-title"><?= $artwork->title()->html() ?></div>
                  <div class="artwork-hidden-main-text"><?= $artwork->artworkTextarea()->kt() ?></div>
                  <div class="artwork-hidden-additional-text"><?= $artwork->additionalTextarea()->kt() ?></div>
                  <div class="artwork-hidden-author"><?= $artwork->author()->html() ?></div>
                  <div class="artwork-gallery-images" data-artwork-title="<?= $artwork->title()->html() ?>">
                    <div class="artwork-gallery-images-scale">
                      <div class="artwork-gallery-images-inner">
                        <?php 
                        try {
                          $galleryArtworkImagesStructure = $artwork->artworkImages()->toStructure();
                          if ($galleryArtworkImagesStructure && $galleryArtworkImagesStructure->count() > 0) {
                            foreach ($galleryArtworkImagesStructure as $index => $image): 
                              $imageIndex = $index + 1;
                              $galleryContainerClasses = "single-gallery-image artwork-{$sanitizedTitle}-{$imageIndex}";
                              $isExhibitionView = $image->exhibition_view()->bool();
                              $exhibitionPage = $site->find($image->exhibition()->value());
                              $exhibitionName = $exhibitionPage ? $exhibitionPage->title()->value() : '';
                            ?>
                              <div class="image-hidden-caption"><?= $image->caption()->html() ?></div>
                              <?php if($imageFile = $image->artworkImage()->toFile()): ?>
                                <?php
                                  // Determine if this is a landscape image and adjust quality and width accordingly
                                  $isLandscape = $imageFile->isLandscape();
                                  $aspectRatio = $imageFile->ratio();
                                  $isWideLandscape = $isLandscape && $aspectRatio > 2; // Wide landscape
                                  
                                  // Adjust quality and width based on aspect ratio
                                  $quality400 = $isWideLandscape ? 90 : 80;
                                  $quality700 = $isWideLandscape ? 92 : 80;
                                  $quality1000 = $isWideLandscape ? 100 : 85;
                                  $quality1500 = $isWideLandscape ? 100 : 90;
                                  
                                  // Adjust widths for landscape images to ensure sufficient resolution
                                  $width400 = $isWideLandscape ? 800 : 400;
                                  $width700 = $isWideLandscape ? 1500 : 700;
                                  $width1000 = $isWideLandscape ? 2000 : 1000;
                                  $width1500 = $isWideLandscape ? 2500 : 1500;
                                ?>
                                <img 
                                  src="<?= $imageFile->thumb(['width' => 100, 'quality' => 30, 'format' => 'webp'])->url() ?>"
                                  data-srcset="<?= $imageFile->srcset([
                                      '400w'  => ['width' => $width400,  'quality' => $quality400, 'format' => 'webp'],
                                      '700w'  => ['width' => $width700,  'quality' => $quality700, 'format' => 'webp'],
                                      '1000w' => ['width' => $width1000, 'quality' => $quality1000, 'format' => 'webp'],
                                      '1500w' => ['width' => $width1500, 'quality' => $quality1500, 'format' => 'webp'],
                                  ]) ?>"
                                  data-sizes="(min-width: 1200px) 25vw, (min-width: 900px) 33vw, (min-width: 600px) 50vw, 100vw"
                                  alt="<?= $image->caption()->html() ?>" 
                                  class="<?= $galleryContainerClasses ?> progressive-image"
                                  data-high-res="<?= $imageFile->resize(1500)->url() ?>"
                                  data-exhibition-view="<?= $isExhibitionView ? 'true' : 'false' ?>"
                                  data-exhibition="<?= $exhibitionName ?>">
                              <?php endif ?>
                            <?php endforeach;
                          }
                        } catch (Exception $e) {
                          // Handle invalid artworkImages data gracefully
                        }
                        ?>
                      </div>
                    </div>
                  </div>
                </div>
                <?php $artworkGalleryCounter++; ?>
              <?php endforeach ?>
            </div>
          </div>
        <?php endif ?>
        <div class="calendar-outter-container">

            <?php $calendar = $site->find('calendar'); ?>
            <div class="calendar-scroll-container">
                <div class="calendar-container">
                    <div class="current-events-container events-container">
                        <div class="events-headline italic">Current</div>
                        <div class="current-events"></div>
                    </div>
                    <div class="upcoming-events-container events-container">
                        <div class="events-headline italic">Upcoming</div>
                        <div class="upcoming-events"></div>
                    </div>
                    <div class="past-events-container events-container">
                        <div class="events-headline italic">Past</div>
                        <div class="past-events"></div>
                    </div>
                        <?php foreach ($calendar->children() as $calendarEntry): ?>
                        <?php 
                            $calendarEntryTitle = $calendarEntry->title()->value();
                            $sanitizedCalendarTitle = preg_replace('/[^a-z]/', '', strtolower($calendarEntryTitle));
                            $eventContainerClass = "event-container {$sanitizedCalendarTitle}-event";
                        ?>
                        <div class="<?= $eventContainerClass ?>" 
                            data-start-date="<?= $calendarEntry->startDate()->html() ?>" 
                            data-end-date="<?= $calendarEntry->endDate()->html() ?>">
                            <div class="event-title"><?= $calendarEntry->title()->html() ?></div>
                            <div class="event-content preview-visible">
                                <div class="event-preview-container">
                                    <div class="event-time">
                                        <?= date('j.n.', strtotime($calendarEntry->startDate()->html())) ?> – <?= date('j.n.y', strtotime($calendarEntry->endDate()->html())) ?>
                                    </div>
                                    <?php if ($calendarEntry->openingDate()->isNotEmpty()): ?>
                                    <div class="event-opening">Opening: <?= date('j.n.y', strtotime($calendarEntry->openingDate()->html())) ?><?php 
                                        if ($calendarEntry->openingTime()->isNotEmpty()): 
                                            echo ' at ';
                                            $time = $calendarEntry->openingTime()->html();
                                            $timeObj = new DateTime($time);
                                            $hour = (int)$timeObj->format('g'); // 12-hour format without leading zeros
                                            $minute = (int)$timeObj->format('i');
                                            $period = $timeObj->format('A'); // AM/PM
                                            
                                            if ($minute == 0) {
                                                echo $hour . ' ' . strtolower($period);
                                            } else {
                                                echo $hour . ':' . $timeObj->format('i') . ' ' . strtolower($period);
                                            }
                                        endif; ?>
                                    </div>
                                    <?php endif; ?>
                                    <div class="event-location">
                                        <?php 
                                        try {
                                            $locationStructure = $calendarEntry->location()->toStructure();
                                            if ($locationStructure && $locationStructure->count() > 0) {
                                                foreach ($locationStructure as $location): 
                                                    $locationName = $location->name()->html();
                                                    $city = $location->city()->html();
                                                    $country = $location->country()->html();
                                                    
                                                    // Build the location string
                                                    $locationString = $locationName;
                                                    if ($city && $country) {
                                                        $locationString .= ', ' . $city . ' (' . $country . ')';
                                                    } elseif ($city) {
                                                        $locationString .= ', ' . $city;
                                                    } elseif ($country) {
                                                        $locationString .= ' (' . $country . ')';
                                                    }
                                                    
                                                    echo $locationString;
                                                endforeach;
                                            }
                                        } catch (Exception $e) {
                                            // Handle invalid location data gracefully
                                            echo 'Location information unavailable';
                                        }
                                        ?>
                                    </div>
                                    <div class="event-more-information-button">
                                        <span class="arrow">→</span>
                                        <span class="italic">more information</span>
                                    </div>
                                </div>
                                <div class="event-full-container no-opacity display-none">
                                    <div class="event-full-info-element">
                                        <div class="event-full-subheadline italic">Dates:</div>
                                        <div class="event-full-info-text">
                                            <?= date('j.n.', strtotime($calendarEntry->startDate()->html())) ?> – <?= date('j.n.y', strtotime($calendarEntry->endDate()->html())) ?>
                                        </div>
                                    </div>
                                    <?php if ($calendarEntry->openingDate()->isNotEmpty()): ?>
                                    <div class="event-full-info-element">
                                        <div class="event-full-subheadline italic">Opening:</div>
                                        <div class="event-full-info-text">
                                            <?= date('j.n.y', strtotime($calendarEntry->openingDate()->html())) ?><?php 
                                            if ($calendarEntry->openingTime()->isNotEmpty()): 
                                                echo ' at ';
                                                $time = $calendarEntry->openingTime()->html();
                                                $timeObj = new DateTime($time);
                                                $hour = (int)$timeObj->format('g'); // 12-hour format without leading zeros
                                                $minute = (int)$timeObj->format('i');
                                                $period = $timeObj->format('A'); // AM/PM
                                                
                                                if ($minute == 0) {
                                                    echo $hour . ' ' . strtolower($period);
                                                } else {
                                                    echo $hour . ':' . $timeObj->format('i') . ' ' . strtolower($period);
                                                }
                                            endif; ?>
                                        </div>
                                    </div>
                                    <?php endif; ?>
                                    <?php 
                                    try {
                                        $locationStructure = $calendarEntry->location()->toStructure();
                                        if ($locationStructure && $locationStructure->count() > 0): ?>
                                            <div class="event-full-info-element">
                                                <div class="event-full-subheadline italic">Location:</div>
                                                <div class="event-full-info-text">
                                                    <?php foreach ($locationStructure as $location): ?>
                                                        <?php if ($location->name()->isNotEmpty()): ?>
                                                            <?= $location->name()->html() ?><br>
                                                        <?php endif; ?>
                                                        <?php if ($location->street()->isNotEmpty()): ?>
                                                            <?= $location->street()->html() ?><br>
                                                        <?php endif; ?>
                                                        <?php if ($location->zip()->isNotEmpty() || $location->city()->isNotEmpty()): ?>
                                                            <?= $location->zip()->html() ?> <?= $location->city()->html() ?><br>
                                                        <?php endif; ?>
                                                        <?php if ($location->country()->isNotEmpty()): ?>
                                                            <?= $location->country()->html() ?>
                                                        <?php endif; ?>
                                                    <?php endforeach ?>
                                                </div>
                                            </div>
                                        <?php endif;
                                    } catch (Exception $e) {
                                        // Handle invalid location data gracefully
                                    }
                                    ?>
                                    <?php if ($calendarEntry->openingHours()->isNotEmpty()): ?>
                                        <div class="event-full-info-element">
                                            <div class="event-full-subheadline italic">Opening hours:</div>
                                            <div class="event-full-info-text">
                                                <?= str_replace('-', '–', $calendarEntry->openingHours()->kt()) ?>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                    <?php 
                                    try {
                                        $otherParticipantsStructure = $calendarEntry->otherParticipants()->toStructure();
                                        if ($otherParticipantsStructure && $otherParticipantsStructure->count() > 0): ?>
                                            <div class="event-full-info-element">
                                                <div class="event-full-subheadline italic">Other participants:</div>
                                                <div class="event-full-info-text">
                                                    <?php foreach ($otherParticipantsStructure as $participant): ?>
                                                        <?= $participant->otherParticipant()->html() ?><br>
                                                    <?php endforeach; ?>
                                                </div>
                                            </div>
                                        <?php endif;
                                    } catch (Exception $e) {
                                        // Handle invalid otherParticipants data gracefully
                                    }
                                    ?>
                                    <?php if ($calendarEntry->website()->isNotEmpty()): ?>
                                        <div class="event-full-info-element">
                                            <div class="event-full-info-text">
                                                <a href="<?= $calendarEntry->website()->html() ?>" target="_blank"><span class="arrow arrow-margin">→</span><span class="italic">visit website</span></a>
                                            </div>
                                        </div>
                                    <?php endif; ?>
                                    <?php if ($calendarEntry->info_textarea()->isNotEmpty()): ?>
                                        <div class="event-text">
                                            <?= $calendarEntry->info_textarea()->kt() ?>
                                        </div>
                                    <?php endif; ?>
                                    <?php 
                                    try {
                                        $eventImagesStructure = $calendarEntry->eventImages()->toStructure();
                                        if ($eventImagesStructure && $eventImagesStructure->count() > 0): ?>
                                        <div class="event-images-container">
                                            <?php foreach ($eventImagesStructure as $image): ?>
                                                <div class="event-image-container">
                                                    <?php if($eventImageFile = $image->eventImage()->toFile()): ?>
                                                        <img 
                                                            src="<?= $eventImageFile->thumb(['width' => 10, 'quality' => 10, 'format' => 'webp'])->url() ?>"
                                                            data-srcset="<?= $eventImageFile->srcset([
                                                                '400w'  => ['width' => 400,  'quality' => 80, 'format' => 'webp'],
                                                                '700w'  => ['width' => 700,  'quality' => 80, 'format' => 'webp'],
                                                                '1000w' => ['width' => 1000, 'quality' => 85, 'format' => 'webp'],
                                                                '1500w' => ['width' => 1500, 'quality' => 90, 'format' => 'webp'],
                                                            ]) ?>"
                                                            data-sizes="(min-width: 1200px) 33vw, (min-width: 900px) 50vw, 100vw"
                                                            class="event-image"
                                                            data-high-res="<?= $eventImageFile->resize(1500)->url() ?>">
                                                        <div class="event-image-credits-hidden">
                                                            <?= $image->caption()->html() ?>
                                                        </div>
                                                    <?php endif ?>
                                                    <?php 
                                                    $visibleArtworksField = $image->visibleArtworks();
                                                    $artworks = null;
                                                    
                                                    if ($visibleArtworksField->isNotEmpty()) {
                                                        $artworkIds = $visibleArtworksField->split(',');
                                                        $artworks = new Kirby\Cms\Pages();
                                                        foreach ($artworkIds as $artworkId) {
                                                            $artworkId = trim($artworkId);
                                                            if ($artwork = page($artworkId)) {
                                                                $artworks->add($artwork);
                                                            }
                                                        }
                                                    }
                                                    
                                                    // Check if we have any artworks
                                                    if ($artworks && $artworks->count() > 0): 
                                                    ?>
                                                    <div class="event-image-caption-outter">
                                                        <?php foreach ($artworks as $artwork): ?>
                                                        <div class="event-image-caption">
                                                            <div class="visible-artwork-title">
                                                                <?= $artwork->title()->html() ?>
                                                            </div>
                                                            <div class="view-series-button">
                                                                <span class="arrow">→</span>
                                                                <span class="italic">view artwork</span>
                                                            </div>
                                                        </div>
                                                        <?php endforeach; ?>
                                                    </div>
                                                    <?php endif; ?>
                                                </div>
                                            <?php endforeach; ?>
                                        </div>
                                        <?php endif;
                                    } catch (Exception $e) {
                                        
                                    }
                                    ?>
                                    <div class="event-less-information-button">
                                        <span class="arrow">←</span>
                                        <span class="italic">less information</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                     <?php endforeach ?>
                </div>
            </div>
        </div>
        <footer id="footer">
            <div class="artwork-info-container hidden display-none">
                <div class="artwork-title-caption-container no-opacity">
                    <div class="artwork-title no-opacity">
                        <div class="artwork-title-inner">
                            <div class="artwork-title-text"></div>
                            <div class="view-exhibition-button">
                                <span class="arrow arrow-negative-margin">→</span>
                                <span class="italic">view exhibition</span>
                            </div>
                        </div>
                    </div>
                    <div class="image-counter">
                        <span class="current-image-number">08</span>
                        <span class="image-counter-separator">/</span>
                        <span class="total-image-number">10</span>
                    </div>
                    <div class="image-caption-mobile-line"></div>
                    <div class="image-caption no-opacity"></div>
                </div>
                <div class="artwork-main-text-container">
                    <div class="artwork-main-text"></div>
                </div>
            </div>
            <div class="artwork-additional-text-container">
                <div class="artwork-author-text"></div>
                <div class="artwork-additional-text"></div>
            </div>
            <div class="info-button no-opacity"><span class="arrow arrow-margin">→</span>Info</div>
        </footer>

        <script src="<?= $asset('assets/js/initialize.js') ?>"></script>
        <script src="<?= $asset('assets/js/image-loading.js') ?>"></script>
        <script src="<?= $asset('assets/js/progressive-loading.js') ?>"></script>
        <script src="<?= $asset('assets/js/grid-layout.js') ?>"></script>
        <script src="<?= $asset('assets/js/calendar.js') ?>"></script>
        <script src="<?= $asset('assets/js/calendar-sorting.js') ?>"></script>
        <script src="<?= $asset('assets/js/zoom.js') ?>"></script>
        <script src="<?= $asset('assets/js/favicon.js') ?>"></script>
        <script src="<?= $asset('assets/js/cursor.js') ?>"></script>
        <script src="<?= $asset('assets/js/imprint.js') ?>"></script>
    </body>

</html>